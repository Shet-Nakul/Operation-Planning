import WebSocket from 'ws';
import logger from '../config/logger';
import { prepareSchedulePayload } from './schedulingPayloadPreparer';
import { processStore } from '../tmpMemory/processStore';
import prisma from '../models/prisma';
import { configurations } from '../config/schedulingConfig';

let isProcessRunning = false;

let schedulingCompletionHook: ((organizationId: number, success: boolean) => void) | null = null;
export function registerSchedulingCompletionHook(hook: (organizationId: number, success: boolean) => void): void {
  schedulingCompletionHook = hook;
}

export async function triggerProcess(
    organizationId: number,
    options?: { triggerDate?: Date }
): Promise<{
    success: boolean;
    message: string;
    processId?: string;
}> {
    if (isProcessRunning) {
        return {
            success: false,
            message: 'Process is still running'
        };
    }

    try {
        
        const payload = await prepareSchedulePayload(organizationId, options);
        logger.debug('Preparing payload', { payload });

        const process = processStore.create(payload.length);

        logger.info(`Created roster process ${process.processId}`);

        isProcessRunning = true;

        sendWebSocketPayload(process.processId, organizationId, payload)
            .then(() => { schedulingCompletionHook?.(organizationId, true); })
            .catch((error) => {
                logger.error(error);
                schedulingCompletionHook?.(organizationId, false);
            });

        return {
            success: true,
            processId: process.processId,
            message: 'Process started successfully'
        };
    } catch (error) {
        logger.error(error);

        isProcessRunning = false;

        return {
            success: false,
            message: 'Failed to start process'
        };
    }
}

function yearMonthFromDateKey(dateKey: string | undefined): { year: number; month: number } | null {
    if (!dateKey) return null;
    const parts = String(dateKey).split('-');
    if (parts.length < 2) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    if (!year || !month) return null;
    return { year, month };
}

function extractYearMonthFromSolutions(solutions: any, fallbackStartDate?: string): { year: number; month: number } | null {
    const employeeCentric = solutions?.employee_centric || {};
    const firstEmployeeKey = Object.keys(employeeCentric)[0];
    const employeeDates = firstEmployeeKey ? employeeCentric[firstEmployeeKey] : null;
    const fromEmployee = yearMonthFromDateKey(employeeDates ? Object.keys(employeeDates)[0] : undefined);
    if (fromEmployee) return fromEmployee;

    const poolCentric = solutions?.pool_centric || {};
    const firstPoolKey = Object.keys(poolCentric)[0];
    const poolDates = firstPoolKey ? poolCentric[firstPoolKey] : null;
    const fromPool = yearMonthFromDateKey(poolDates ? Object.keys(poolDates)[0] : undefined);
    if (fromPool) return fromPool;

    const dateCentric = solutions?.date_centric || {};
    const fromDate = yearMonthFromDateKey(Object.keys(dateCentric)[0]);
    if (fromDate) return fromDate;

    return yearMonthFromDateKey(fallbackStartDate);
}

async function sendWebSocketPayload(
    processId: string,
    organizationId: number,
    payload: any[]
): Promise<void> {
    return new Promise(
        (resolve, reject) => {
            let ws: WebSocket;
            let currentIndex = 0;
            let responseTimeout: NodeJS.Timeout | undefined;
            let reconnectAttempts = 0;
            let settled = false;
            let persistStarted = false;

            let accEmployeeCentric: Record<string, any> = {};
            let accPoolCentric: Record<string, any> = {};
            let accDateCentric: Record<string, any> = {};
            let accStats: any = null;
            let accYear: number | null = null;
            let accMonth: number | null = null;
            const maxReconnectAttempts = 5;
            const reconnectDelay = 500;
            const responseTimeoutMs = 10 * 60 * 1000;
            const fallbackStartDate = payload[0]?.start_date as string | undefined;

            const settle = (ok: boolean, error?: Error) => {
                if (settled) return;
                settled = true;
                clearTimeout(responseTimeout);
                isProcessRunning = false;
                if (ok) resolve();
                else reject(error ?? new Error('Rostering process failed'));
            };

            const armResponseTimeout = () => {
                clearTimeout(responseTimeout);
                responseTimeout = setTimeout(() => {
                    logger.error('Response timeout', { processId, item: currentIndex + 1, total: payload.length });
                    processStore.fail(processId, 'Response timeout');
                    try { ws.close(); } catch { /* already closed */ }
                    settle(false, new Error('Response timeout'));
                }, responseTimeoutMs);
            };

            const persistAndFinish = async () => {
                if (persistStarted) return;
                persistStarted = true;
                clearTimeout(responseTimeout);

                if (!accYear || !accMonth) {
                    const fallback = yearMonthFromDateKey(fallbackStartDate);
                    if (fallback) {
                        accYear = fallback.year;
                        accMonth = fallback.month;
                    }
                }

                if (accYear && accMonth) {
                    try {
                        await prisma.rostering.deleteMany({
                            where: { organization_id: organizationId, year: accYear, month: accMonth }
                        });
                        await prisma.rostering.create({
                            data: {
                                organization_id: organizationId,
                                year: accYear,
                                month: accMonth,
                                employee_centric: accEmployeeCentric,
                                pool_centric: accPoolCentric,
                                date_centric: accDateCentric,
                                stats: accStats ?? {}
                            }
                        });
                        logger.info('Rostering data saved to database (post-run)', {
                            processId,
                            year: accYear,
                            month: accMonth,
                            employees: Object.keys(accEmployeeCentric).length,
                            pools: Object.keys(accPoolCentric).length
                        });
                    } catch (dbError) {
                        logger.error('Failed to save rostering data to database', dbError);
                        processStore.fail(processId, 'Failed to save rostering data');
                        settle(false, dbError instanceof Error ? dbError : new Error('Failed to save rostering data'));
                        try { ws.close(); } catch { /* already closed */ }
                        return;
                    }
                } else {
                    logger.error('Skipping rostering persist: could not determine year/month', { processId, fallbackStartDate });
                }

                logger.info(`Process completed ${processId}`);
                processStore.complete(processId);
                settle(true);
                try { ws.close(); } catch { /* already closed */ }
            };

            function connect() {
                ws = new WebSocket(process.env.WEBSOCKET_URL_ROSTER || '');

                ws.on('open', () => {
                    logger.info(`WebSocket Connected (${processId})`);
                    reconnectAttempts = 0;
                    processStore.update(processId, { status: 'processing' });
                    sendNext();
                });

                ws.on('message', (message) => {
                    clearTimeout(responseTimeout);

                    const rawMessage = message.toString();
                    let parsedResponse: any;
                    try {
                        parsedResponse = eval(`(${rawMessage})`);
                        logger.debug('Parsed WebSocket Response', { processId, status: parsedResponse?.status });
                    } catch (error) {
                        logger.error('Failed to parse websocket response', { processId, rawMessage });
                        return;
                    }

                    if (parsedResponse.status === 'progress') {
                        logger.info(`Progress Update: ${parsedResponse.data?.progress_pct ?? 0}%`);
                        armResponseTimeout();
                        return;
                    }

                    if (parsedResponse.status === 'completed') {
                        logger.info(`Completed response received for item ${currentIndex + 1}/${payload.length}`);

                        const solutions = parsedResponse.solutions ?? parsedResponse.result?.solutions ?? parsedResponse;
                        const newEmployeeCentric = solutions?.employee_centric || {};
                        const newPoolCentric = solutions?.pool_centric || {};
                        const newDateCentric = solutions?.date_centric || {};
                        const ym = extractYearMonthFromSolutions(solutions, fallbackStartDate);

                        if (ym) {
                            if (!accYear) { accYear = ym.year; accMonth = ym.month; }
                            Object.assign(accEmployeeCentric, newEmployeeCentric);
                            Object.assign(accPoolCentric, newPoolCentric);
                            for (const dateKey in newDateCentric) {
                                if (!accDateCentric[dateKey]) accDateCentric[dateKey] = {};
                                Object.assign(accDateCentric[dateKey], newDateCentric[dateKey]);
                            }
                            accStats = parsedResponse.stats ?? solutions?.stats ?? accStats;
                        } else {
                            logger.error('Could not extract year and month from rostering data', {
                                processId,
                                solutionKeys: solutions && typeof solutions === 'object' ? Object.keys(solutions) : typeof solutions
                            });
                        }

                        currentIndex++;
                        processStore.update(processId, { processedItems: currentIndex });

                        if (currentIndex < payload.length) {
                            // Solver closes after each group. Do not send the next group on a dying socket.
                            try { ws.close(); } catch { /* already closed */ }
                        } else {
                            void persistAndFinish();
                        }
                        return;
                    }

                    if (parsedResponse.status === 'error') {
                        logger.error('Solver returned error', { processId, response: parsedResponse });
                        processStore.fail(processId, parsedResponse.message || 'Solver error');
                        try { ws.close(); } catch { /* already closed */ }
                        settle(false, new Error(parsedResponse.message || 'Solver error'));
                    }
                });

                ws.on('error', (error) => {
                    logger.error('WebSocket Error', error);
                });

                ws.on('close', () => {
                    logger.info(`WebSocket Closed (${processId})`);
                    if (settled || persistStarted) return;

                    if (currentIndex >= payload.length) {
                        void persistAndFinish();
                        return;
                    }

                    if (reconnectAttempts < maxReconnectAttempts) {
                        reconnectAttempts++;
                        logger.info(`Reconnecting attempt ${reconnectAttempts}/${maxReconnectAttempts} in ${reconnectDelay}ms (item ${currentIndex + 1}/${payload.length} still pending)`);
                        setTimeout(connect, reconnectDelay);
                    } else {
                        logger.error('Max reconnect attempts reached');
                        processStore.fail(processId, 'Max reconnect attempts reached');
                        settle(false, new Error('Max reconnect attempts reached'));
                    }
                });
            }

            function sendNext() {
                if (settled || persistStarted) return;
                if (!ws || ws.readyState !== WebSocket.OPEN) {
                    logger.warn('WebSocket not open, waiting for reconnection');
                    return;
                }

                const item = payload[currentIndex];
                logger.info(`Sending ${currentIndex + 1}/${payload.length}`);
                logger.debug('Schedule Payload', { item });
                ws.send(JSON.stringify({
                    data: item,
                    config: configurations
                }));
                armResponseTimeout();
            }

            connect();
        }
    );
}

export function getProcessState() {
    return {
        running: isProcessRunning
    };
}