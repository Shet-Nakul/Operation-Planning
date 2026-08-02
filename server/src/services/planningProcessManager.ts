import WebSocket from 'ws';
import logger from '../config/logger';
import { prepareSurgeryPlanningPayloads } from './planningPayloadPreparer';
import { processStore } from '../tmpMemory/processStore';
import prisma from '../models/prisma';

// SearchConfig required by the planning solver's /single and /multi endpoints.
// Feasibility endpoint does not accept a config block.
const PLANNING_SEARCH_CONFIG = {
    simulated_annealing: {
        max_iterations: 1000,
        initial_temp: 100.0,
        min_temp: 1.0,
        cooling_rate: 0.95,
        neighborhood_size: 10,
        exploration: true,
    },
    tabu_search: {
        tabu_tenure: 10,
        max_iterations: 1000,
        max_no_improve: 100,
        neighborhood_size: 10,
        exploration: true,
    },
    adaptive_search: {
        sa_initial_temp: 100.0,
        sa_cooling_rate: 0.95,
        sa_burst_length: 50,
        max_iterations: 2000,
        max_no_improve: 200,
        neighborhood_size: 10,
        switch_threshold: 5,
        ts_inner_iterations: 100,
    },
};

let isPlanningRunning = false;
let currentRunOrganizationId = 0;

let planningCompletionHook: ((organizationId: number, success: boolean) => void) | null = null;
export function registerPlanningCompletionHook(hook: (organizationId: number, success: boolean) => void): void {
    planningCompletionHook = hook;
}

export async function triggerSurgeryPlanning(
    organizationId: number
): Promise<{ success: boolean; message: string; processId?: string }> {
    if (isPlanningRunning) {
        return { success: false, message: 'Surgery planning process is still running' };
    }

    isPlanningRunning = true;
    currentRunOrganizationId = organizationId;

    try {
        logger.info('Preparing surgery planning payloads');
        const payloads = await prepareSurgeryPlanningPayloads(organizationId);
        const process = processStore.create(payloads.length);
        logger.info(`Created surgery planning process ${process.processId}`);

        if (payloads.length === 0) {
            logger.info(`No departments to plan for organization ${organizationId}`);
            processStore.complete(process.processId);
            isPlanningRunning = false;
            planningCompletionHook?.(organizationId, true);
        } else {
            runPlanningPipeline(process.processId, organizationId, payloads)
                .then(() => { planningCompletionHook?.(organizationId, true); })
                .catch((error) => {
                    logger.error(error);
                    planningCompletionHook?.(organizationId, false);
                });
        }

        return { success: true, processId: process.processId, message: 'Surgery planning process started successfully' };
    } catch (error) {
        logger.error(error);
        isPlanningRunning = false;
        planningCompletionHook?.(organizationId, false);
        return { success: false, message: 'Failed to start surgery planning process' };
    }
}

// Orchestrates the full two-phase pipeline: feasibility check → planning.
async function runPlanningPipeline(processId: string, organizationId: number, payloads: any[]): Promise<void> {
    try {
        processStore.update(processId, { status: 'processing' });

        // Phase 1: feasibility — filter each department payload, keeping only feasible surgeries.
        logger.info(`Phase 1: feasibility check for ${payloads.length} department(s)`);
        logger.debug('Raw payloads', { payloads });
        const feasiblePayloads = await runFeasibilityPhase(payloads);
        
        // Transition feasible surgeries from ESTIMATED → PLANNING now that they are confirmed sendable.
        const feasibleIds = feasiblePayloads.flatMap(p => p.surgeries.map((s: any) => s.id));
        if (feasibleIds.length > 0) {
            await prisma.surgery.updateMany({
                where: { surgery_id: { in: feasibleIds }, status: 'ESTIMATED' },
                data: { status: 'PLANNING' },
            });
            logger.info(`Transitioned ${feasibleIds.length} surgery/surgeries ESTIMATED → PLANNING`);
        }

        // Phase 2: planning — send each department to the appropriate solver endpoint.
        logger.info(`Phase 2: planning for ${feasiblePayloads.length} department(s) with eligible surgeries`);
        await runPlanningPhase(processId, feasiblePayloads, organizationId);

        processStore.complete(processId);
    } finally {
        isPlanningRunning = false;
    }
}

// Phase 1: sends each department payload to the feasibility endpoint and returns
// only the payloads that have at least one feasible surgery (with infeasible ones removed).
async function runFeasibilityPhase(payloads: any[]): Promise<any[]> {
    const url = process.env.WEBSOCKET_URL_PLANNING_FEASIBILITY || '';
    const feasiblePayloads: any[] = [];

    for (const payload of payloads) {
        const surgeryCount = payload.surgeries?.length ?? 0;
        if (surgeryCount === 0) {
            logger.info(`Feasibility check: department "${payload.department}" skipped (no eligible surgeries)`);
            continue;
        }
        try {
            logger.info(`Feasibility check: department "${payload.department}" (${surgeryCount} surgeries)`);
            const response = await sendSinglePayload(url, payload);

            // Response: { status:"completed", result: JSON-string }
            // Parsed result shape: { feasibles: [{surgery_id}], infeasibles: [{surgery_id, top_feasible_starts}] }
            let parsed = response.result;
            if (typeof parsed === 'string') try { parsed = JSON.parse(parsed); } catch { parsed = {}; }

            const infeasibleIds = new Set<string>(
                (parsed?.infeasibles || []).map((f: any) => f.surgery_id)
            );
            const feasibleSurgeries = (payload.surgeries || []).filter(
                (s: any) => !infeasibleIds.has(s.id)
            );

            const infeasibleCount = (parsed?.infeasibles || []).length;
            if (infeasibleCount > 0) {
                logger.info(`Department "${payload.department}": ${infeasibleCount} infeasible surgery/surgeries dropped`);
                (parsed?.infeasibles || []).forEach((inf: any) => {
                    logger.info(`Infeasible surgery "${inf.surgery_id}" — top feasible starts: ${JSON.stringify(inf.top_feasible_starts || [])}`);
                });
            }

            if (feasibleSurgeries.length > 0) {
                feasiblePayloads.push({ ...payload, surgeries: feasibleSurgeries });
            }
        } catch (err) {
            logger.error(`Feasibility check failed for department "${payload.department}"`, err);
            // Skip this department entirely on feasibility error rather than aborting the whole run.
        }
    }

    return feasiblePayloads;
}

// Phase 2: sends each (already feasibility-filtered) department payload to the planning solver.
// Routes to WEBSOCKET_URL_PLANNING_SINGLE when there is exactly 1 surgery, otherwise WEBSOCKET_URL_PLANNING.
// Saves per-surgery results to surgery_plan_results and transitions surgery status to PLANNED.
async function runPlanningPhase(processId: string, payloads: any[], organizationId: number): Promise<void> {
    const multiUrl = process.env.WEBSOCKET_URL_PLANNING || '';
    const singleUrl = process.env.WEBSOCKET_URL_PLANNING_SINGLE || '';
    let processedCount = 0;

    for (const payload of payloads) {
        const surgeryCount = payload.surgeries?.length ?? 0;
        const url = surgeryCount === 1 ? singleUrl : multiUrl;

        logger.info(`Planning: department "${payload.department}" — ${surgeryCount} surgery/surgeries → ${surgeryCount === 1 ? 'single' : 'multi'} endpoint`);

        try {
            const response = await sendSinglePayload(url, payload, PLANNING_SEARCH_CONFIG);

            // Planning response: { status:"completed", result: JSON-string-or-object }
            // Parsed result shape: { scheduled: [{id, resources_assigned, planned_start}], dropped: [...], infeasible: [...] }
            let parsed = response.result;
            if (typeof parsed === 'string') try { parsed = JSON.parse(parsed); } catch { parsed = {}; }
            const scheduled: any[] = parsed?.scheduled || [];

            logger.info(`Planning completed for "${payload.department}": ${scheduled.length} scheduled, ${(parsed?.dropped||[]).length} dropped`);

            for (const surgeryResult of scheduled) {
                const surgeryId: string = surgeryResult.id;
                if (!surgeryId) continue;

                // Save the full solver output for this surgery.
                await prisma.surgeryPlanResult.upsert({
                    where: { surgery_id: surgeryId },
                    update: { result: surgeryResult, department: payload.department, organization_id: organizationId },
                    create: { surgery_id: surgeryId, organization_id: organizationId, department: payload.department, result: surgeryResult },
                });

                // planned_start is a top-level field on each scheduled surgery ("YYYY-MM-DD HH:MM:SS").
                if (surgeryResult.planned_start) {
                    const existing = await prisma.surgery.findUnique({ where: { surgery_id: surgeryId } });
                    if (existing) {
                        const updatedTimeWindows = {
                            ...((existing.time_windows as Record<string, any>) || {}),
                            planned_start: surgeryResult.planned_start,
                        };
                        await prisma.surgery.update({
                            where: { surgery_id: surgeryId },
                            data: { time_windows: updatedTimeWindows, status: 'PLANNED' },
                        });
                        logger.info(`Surgery "${surgeryId}" PLANNING → PLANNED, planned_start = ${surgeryResult.planned_start}`);
                    }
                } else {
                    await prisma.surgery.updateMany({
                        where: { surgery_id: surgeryId, status: 'PLANNING' },
                        data: { status: 'PLANNED' },
                    });
                    logger.info(`Surgery "${surgeryId}" PLANNING → PLANNED (no planned_start)`);
                }
            }
        } catch (err) {
            logger.error(`Planning failed for department "${payload.department}"`, err);
            // Log and continue to next department rather than aborting.
        }

        processedCount++;
        processStore.update(processId, { processedItems: processedCount });
    }
}

// Opens a WebSocket to `url`, sends { data: payload, config? } as JSON, resolves with the first
// completed response (or rejects on error/timeout). Progress messages are logged and ignored.
// Pass `config` for the planning/single and planning/multi endpoints; omit for feasibility.
function sendSinglePayload(url: string, payload: any, config?: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(url);
        let responseTimeout: NodeJS.Timeout;

        ws.on('open', () => {
            logger.debug('WebSocket open', { url });
            const envelope: any = { data: payload };
            if (config) envelope.config = config;
            ws.send(JSON.stringify(envelope));
            responseTimeout = setTimeout(() => {
                ws.close();
                reject(new Error(`Response timeout for ${url}`));
            }, 300000);
        });

        ws.on('message', (message) => {
            const raw = message.toString();
            let parsed: any;
            try { parsed = eval(`(${raw})`); } catch {
                logger.error('Failed to parse WebSocket response', { raw });
                return;
            }

            if (parsed.status === 'progress') {
                logger.info(`Progress: ${parsed.data?.progress_pct ?? 0}%`);
                return;
            }

            clearTimeout(responseTimeout);
            ws.close();

            if (parsed.status === 'completed') resolve(parsed);
            else reject(new Error(parsed.message || 'Solver returned error'));
        });

        ws.on('error', (err) => {
            clearTimeout(responseTimeout);
            reject(err);
        });
    });
}

export function getPlanningProcessState() {
    return { running: isPlanningRunning };
}
