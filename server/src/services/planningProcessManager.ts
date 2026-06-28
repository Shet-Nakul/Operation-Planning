import WebSocket from 'ws';
import logger from '../config/logger';
import { prepareSurgeryPlanningPayloads } from './planningPayloadPreparer';
import { processStore } from '../tmpMemory/processStore';

let isPlanningRunning = false;

export async function triggerSurgeryPlanning(
    organizationId: number
): Promise<{
    success: boolean;
    message: string;
    processId?: string;
}> {
    if (isPlanningRunning) {
        return {
            success: false,
            message: 'Surgery planning process is still running'
        };
    }

    try {
        logger.info('Preparing surgery planning payloads');

        const payloads = await prepareSurgeryPlanningPayloads(organizationId);
        const process = processStore.create(payloads.length);

        logger.info(`Created surgery planning process ${process.processId}`, { payloads });

        isPlanningRunning = true;

        sendPlanningPayloads(process.processId, payloads).catch((error) => {
            logger.error(error);
        });

        return {
            success: true,
            processId: process.processId,
            message: 'Surgery planning process started successfully'
        };
    } catch (error) {
        logger.error(error);

        isPlanningRunning = false;

        return {
            success: false,
            message: 'Failed to start surgery planning process'
        };
    }
}

// Sends one department payload at a time, waiting for a completed/error response before the next.
async function sendPlanningPayloads(
    processId: string,
    payloads: any[]
): Promise<void> {
    return new Promise(
        (resolve, reject) => {
            let ws: WebSocket;
            let currentIndex = 0;
            let responseTimeout: NodeJS.Timeout | undefined;
            let reconnectAttempts = 0;
            const maxReconnectAttempts = 5;
            const reconnectDelay = 500;

            function connect() {
                ws = new WebSocket(process.env.WEBSOCKET_URL_PLANNING || '');

                ws.on('open', () => {
                    logger.info(`Planning WebSocket Connected (${processId})`);
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
                        logger.debug('Raw Planning WebSocket Message', { parsedResponse });
                    } catch (error) {
                        logger.error('Failed to parse planning websocket response', { processId, rawMessage });
                        return;
                    }

                    if (parsedResponse.status === 'progress') {
                        logger.info(`Planning Progress Update: ${parsedResponse.data?.progress_pct ?? 0}%`);
                        return;
                    }

                    if (parsedResponse.status === 'completed') {
                        logger.info(`Completed planning response received for department ${currentIndex + 1}/${payloads.length}`);

                        currentIndex++;
                        processStore.update(processId, { processedItems: currentIndex });

                        if (currentIndex < payloads.length) {
                            sendNext();
                        } else {
                            logger.info(`Surgery planning process completed ${processId}`);
                            processStore.complete(processId);
                            isPlanningRunning = false;
                            ws.close();
                            resolve();
                        }
                        return;
                    }

                    if (parsedResponse.status === 'error') {
                        logger.error('Planning solver returned error', { processId, response: parsedResponse });
                        processStore.fail(processId, parsedResponse.message || 'Solver error');
                        isPlanningRunning = false;
                        ws.close();
                        reject(new Error(parsedResponse.message || 'Solver error'));
                        return;
                    }
                });

                ws.on('error', (error) => {
                    logger.error('Planning WebSocket Error', error);
                });

                ws.on('close', () => {
                    logger.info(`Planning WebSocket Closed (${processId})`);

                    if ((currentIndex + 1) < payloads.length) {
                        if (reconnectAttempts < maxReconnectAttempts) {
                            reconnectAttempts++;
                            logger.info(`Reconnecting attempt ${reconnectAttempts}/${maxReconnectAttempts} in ${reconnectDelay}ms`);
                            setTimeout(connect, reconnectDelay);
                        } else {
                            logger.error('Max reconnect attempts reached');
                            processStore.fail(processId, 'Max reconnect attempts reached');
                            isPlanningRunning = false;
                            reject(new Error('Max reconnect attempts reached'));
                        }
                    } else {
                        isPlanningRunning = false;
                        resolve();
                    }
                });
            }

            function sendNext() {
                if (!ws || ws.readyState !== WebSocket.OPEN) {
                    logger.warn('Planning WebSocket not open, waiting for reconnection');
                    return;
                }

                const item = payloads[currentIndex];
                logger.info(`Sending department payload ${currentIndex + 1}/${payloads.length} (${item.department})`);
                logger.debug('Surgery planning payload', { item });

                ws.send(JSON.stringify(item));

                responseTimeout = setTimeout(() => {
                    logger.error('Planning response timeout');
                    processStore.fail(processId, 'Response timeout');
                    isPlanningRunning = false;
                    ws.close();
                    reject(new Error('Response timeout'));
                }, 60000);
            }

            connect();
        }
    );
}

export function getPlanningProcessState() {
    return {
        running: isPlanningRunning
    };
}
