import prisma from '../models/prisma';
import { prepareSchedulePayload } from './payloadPreparer';
import logger from '../config/logger';

let isProcessRunning = false;

export async function triggerProcess(organizationId: number): Promise<{ 
    success: boolean; 
    message: string;
}> {
    if (isProcessRunning) {
        return {
            success: false,
            message: 'Process is still running'
        };
    }

    logger.info('Starting process');
    isProcessRunning = true;

    try {
        await sendWebSocketPayload(organizationId);
        return {
            success: true,
            message: 'Process started successfully'
        };
    } catch (error) {
        logger.error('Error during process:', error);
        isProcessRunning = false;
        return {
            success: false,
            message: 'Failed to start process'
        };
    }
}

async function sendWebSocketPayload(organizationId: number): Promise<void> {
    logger.info('Preparing schedule payload from database');
    const payload = await prepareSchedulePayload(organizationId);
    logger.info('WebSocket payload prepared, would send to wss://localhost:8080');
    logger.debug('Payload:', { payload });
    
    // Simulate WebSocket communication
    setTimeout(() => {
        logger.info('WebSocket process completed');
        isProcessRunning = false;
    }, 2000);
}

export function getProcessState(): { 
    running: boolean;
} {
    return { 
        running: isProcessRunning 
    };
}
