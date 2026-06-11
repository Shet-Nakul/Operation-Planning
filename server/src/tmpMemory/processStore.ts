import { randomUUID } from 'crypto';

export type ProcessStatus =
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed';

export interface ProcessInfo {
    processId: string;
    status: ProcessStatus;
    totalItems: number;
    processedItems: number;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}

class ProcessStore {
    private processes = new Map<string, ProcessInfo>();

    create(totalItems: number): ProcessInfo {
        const process: ProcessInfo = {
            processId: randomUUID(),
            status: 'pending',
            totalItems,
            processedItems: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.processes.set(process.processId, process);
        return process;
    }

    get(processId: string) {
        return this.processes.get(processId);
    }

    getAll(): ProcessInfo[] {
        return Array.from(this.processes.values());
    }

    remove(processId: string) {
        this.processes.delete(processId);
    }

    update(
        processId: string,
        updates: Partial<ProcessInfo>
    ) {
        const existing = this.processes.get(processId);

        if (!existing) return;

        this.processes.set(processId, {
            ...existing,
            ...updates,
            updatedAt: new Date()
        });
    }

    complete(processId: string) {
        this.update(processId, {
            status: 'completed'
        });

        this.cleanupAfter21Seconds(processId);
    }

    fail(processId: string, error: string) {
        this.update(processId, {
            status: 'failed',
            error
        });

        this.cleanupAfter21Seconds(processId);
    }

    private cleanupAfter21Seconds(processId: string) {
        setTimeout(() => {
            this.processes.delete(processId);
        }, 21000);
    }
}

export const processStore = new ProcessStore();