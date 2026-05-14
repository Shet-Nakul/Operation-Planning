"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityLogsDocs = void 0;
exports.activityLogsDocs = {
    '/api/activity-logs': {
        get: {
            tags: ['ActivityLogs'],
            summary: 'Get Activity Logs',
            parameters: [
                { name: 'page', in: 'query', schema: { type: 'integer' } },
                { name: 'limit', in: 'query', schema: { type: 'integer' } },
                { name: 'orgId', in: 'query', schema: { type: 'number' } },
                { name: 'userId', in: 'query', schema: { type: 'number' } },
            ],
            responses: {
                200: { description: 'Success' },
            },
        },
    },
    '/api/activity-logs/{id}': {
        get: {
            tags: ['ActivityLogs'],
            summary: 'Get Activity Log By ID',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
            responses: {
                200: { description: 'Success' },
            },
        },
        delete: {
            tags: ['ActivityLogs'],
            summary: 'Delete Activity Log',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
            responses: {
                204: { description: 'Deleted' },
            },
        },
    },
};
