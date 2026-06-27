import WebSocket from 'ws';
import logger from '../config/logger';
import { prepareSchedulePayload } from './payloadPreparer';
import { processStore } from '../tmpMemory/processStore';
import prisma from '../models/prisma';

let isProcessRunning = false;

export async function triggerProcess(
    organizationId: number
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
        logger.info('Preparing payload');

        const payload = await prepareSchedulePayload(organizationId);
        //logger.debug('Schedule Payload', {payload});
        const process = processStore.create(payload.length);

        logger.info(`Created roster process ${process.processId}`);

        isProcessRunning = true;

        sendWebSocketPayload(process.processId, organizationId, payload).catch((error) => {
            logger.error(error);
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
            const maxReconnectAttempts = 5;
            const reconnectDelay = 500; // 2 seconds

            function connect() {
                ws = new WebSocket(process.env.WEBSOCKET_URL_ROSTER || '');

                ws.on('open', () => {
                    logger.info(`WebSocket Connected (${processId})`);
                    reconnectAttempts = 0;
                    processStore.update(processId, { status: 'processing' });
                    sendNext();
                });

                ws.on('message', async (message) => {
                    clearTimeout(responseTimeout);

                    const rawMessage = message.toString();
                    // logger.debug('Raw WebSocket Message', { processId, message });

                    let parsedResponse: any;
                    try {
                        parsedResponse = eval(`(${rawMessage})`);
                        logger.debug('Raw WebSocket Message', { parsedResponse });
                        logger.debug('Parsed WebSocket Response', { processId, status: parsedResponse?.status });
                    } catch (error) {
                        logger.error('Failed to parse websocket response', { processId, rawMessage });
                        return;
                    }

                    if (parsedResponse.status === 'progress') {
                        logger.info(`Progress Update: ${parsedResponse.data?.progress_pct ?? 0}%`);
                        return;
                    }

                    if (parsedResponse.status === 'completed') {
                        logger.info(`Completed response received for item ${currentIndex + 1}`);
                        
                        // Extract year and month from the first available date in the data
                        let year: number | null = null;
                        let month: number | null = null;
                        
                        // Try to get the first date from employee_centric
                        const newEmployeeCentric = parsedResponse.solutions.employee_centric || {};
                        if (Object.keys(newEmployeeCentric).length > 0) {
                            const firstEmployeeKey = Object.keys(newEmployeeCentric)[0];
                            const employeeDates = newEmployeeCentric[firstEmployeeKey];
                            if (employeeDates && Object.keys(employeeDates).length > 0) {
                                const firstDateKey = Object.keys(employeeDates)[0];
                                const dateParts = firstDateKey.split('-');
                                if (dateParts.length === 3) {
                                    year = parseInt(dateParts[0], 10);
                                    month = parseInt(dateParts[1], 10);
                                }
                            }
                        }
                        
                        // If that didn't work, try pool_centric
                        const newPoolCentric = parsedResponse.solutions.pool_centric || {};
                        if ((!year || !month) && Object.keys(newPoolCentric).length > 0) {
                            const firstPoolKey = Object.keys(newPoolCentric)[0];
                            const poolDates = newPoolCentric[firstPoolKey];
                            if (poolDates && Object.keys(poolDates).length > 0) {
                                const firstDateKey = Object.keys(poolDates)[0];
                                const dateParts = firstDateKey.split('-');
                                if (dateParts.length === 3) {
                                    year = parseInt(dateParts[0], 10);
                                    month = parseInt(dateParts[1], 10);
                                }
                            }
                        }
                        
                        // If that still didn't work, try date_centric
                        const newDateCentric = parsedResponse.solutions.date_centric || {};
                        if ((!year || !month) && Object.keys(newDateCentric).length > 0) {
                            const firstDateKey = Object.keys(newDateCentric)[0];
                            const dateParts = firstDateKey.split('-');
                            if (dateParts.length === 3) {
                                year = parseInt(dateParts[0], 10);
                                month = parseInt(dateParts[1], 10);
                            }
                        }
                        
                        if (year && month) {
                            try {
                                // Check if existing rostering record exists
                                const existingRostering = await prisma.rostering.findUnique({
                                    where: {
                                        organization_id_year_month: {
                                            organization_id: organizationId,
                                            year: year,
                                            month: month
                                        }
                                    }
                                });
                                
                                // Merge new data with existing data
                                let mergedEmployeeCentric = { ...((existingRostering?.employee_centric as Record<string, any>) || {}) };
                                let mergedPoolCentric = { ...((existingRostering?.pool_centric as Record<string, any>) || {}) };
                                let mergedDateCentric = { ...((existingRostering?.date_centric as Record<string, any>) || {}) };
                                
                                // Merge employee_centric: override existing staff entries with new ones
                                Object.assign(mergedEmployeeCentric, newEmployeeCentric);
                                
                                // Merge pool_centric: override existing pool entries with new ones
                                Object.assign(mergedPoolCentric, newPoolCentric);
                                
                                // Merge date_centric: override existing date -> pool entries with new ones
                                for (const dateKey in newDateCentric) {
                                    if (!mergedDateCentric[dateKey]) {
                                        mergedDateCentric[dateKey] = {};
                                    }
                                    Object.assign(mergedDateCentric[dateKey], newDateCentric[dateKey]);
                                }
                                
                                // Save merged data
                                await prisma.rostering.upsert({
                                    where: {
                                        organization_id_year_month: {
                                            organization_id: organizationId,
                                            year: year,
                                            month: month
                                        }
                                    },
                                    update: {
                                        employee_centric: mergedEmployeeCentric,
                                        pool_centric: mergedPoolCentric,
                                        date_centric: mergedDateCentric,
                                        stats: parsedResponse.stats
                                    },
                                    create: {
                                        organization_id: organizationId,
                                        year: year,
                                        month: month,
                                        employee_centric: newEmployeeCentric,
                                        pool_centric: newPoolCentric,
                                        date_centric: newDateCentric,
                                        stats: parsedResponse.stats
                                    }
                                });
                                logger.info('Rostering data merged and saved to database');
                            } catch (dbError) {
                                logger.error('Failed to save rostering data to database', dbError);
                            }
                        } else {
                            logger.error('Could not extract year and month from rostering data');
                        }

                        currentIndex++;
                        processStore.update(processId, { processedItems: currentIndex });

                        if (currentIndex < payload.length) {
                            sendNext();
                        } else {
                            logger.info(`Process completed ${processId}`);
                            processStore.complete(processId);
                            ws.close();
                        }
                        return;
                    }

                    if (parsedResponse.status === 'error') {
                        logger.error('Solver returned error', { processId, response: parsedResponse });
                        processStore.fail(processId, parsedResponse.message || 'Solver error');
                        ws.close();
                        reject(new Error(parsedResponse.message || 'Solver error'));
                        return;
                    }
                });

                ws.on('error', (error) => {
                    logger.error('WebSocket Error', error);
                });

                ws.on('close', () => {
                    logger.info(`WebSocket Closed (${processId})`);
                    
                    if ((currentIndex+1) < payload.length) {
                        if (reconnectAttempts < maxReconnectAttempts) {
                            reconnectAttempts++;
                            logger.info(`Reconnecting attempt ${reconnectAttempts}/${maxReconnectAttempts} in ${reconnectDelay}ms`);
                            setTimeout(connect, reconnectDelay);
                            sendNext();
                        } else {
                            logger.error('Max reconnect attempts reached');
                            processStore.fail(processId, 'Max reconnect attempts reached');
                            isProcessRunning = false;
                            reject(new Error('Max reconnect attempts reached'));
                        }
                    } else {
                        isProcessRunning = false;
                        resolve();
                    }
                });
            }

            function sendNext() {
                if (!ws || ws.readyState !== WebSocket.OPEN) {
                    logger.warn('WebSocket not open, waiting for reconnection');
                    return;
                }

                const item = payload[currentIndex];
                logger.info(`Sending ${currentIndex + 1}/${payload.length}`);
                logger.debug('Schedule Payload', { item });
                const wsPayload = {
                    data: item,
                    config: {
                        "initialization": { "strategy": "random" },
                        "search": {
                            "max_iterations": 100000,
                            "max_minutes": 5,
                            "tabu_tenure": 500,
                            "switch_threshold": 2500,
                            "improvement_threshold": 0.001,
                            "restart_strategy": "adaptive_sigmoid",
                            "random_restart_interval": 5,
                            "adaptive_schedule": "linear",
                            "initial_temp": 50.0,
                            "min_temp": 0.05,
                            "annealing_duration": 500
                        },
                        "moves": {
                            "n_samples": 3,
                            "n_samples_end": 2,
                            "lns_samples": 3,
                            "max_operations": 9,
                            "max_operations_start": 3,
                            "max_block_size": 35
                        },
                        "logging": {
                            "log_interval": 500,
                            "print_interval": 5000
                        }
                    }
                };

                ws.send(JSON.stringify(wsPayload));

                responseTimeout = setTimeout(() => {
                    logger.error('Response timeout');
                    processStore.fail(processId, 'Response timeout');
                    ws.close();
                    reject(new Error('Response timeout'));
                }, 60000);
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