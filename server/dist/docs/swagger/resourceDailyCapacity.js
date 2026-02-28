"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resourceDailyCapacityDocs = void 0;
exports.resourceDailyCapacityDocs = {
    '/api/resource-daily-capacity': {
        get: {
            summary: 'List resource daily capacities',
            description: 'Get a list of resource daily capacities.',
            tags: ['ResourceDailyCapacity'],
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'organizationId', in: 'query', schema: { type: 'integer' }, required: false },
                { name: 'resourceId', in: 'query', schema: { type: 'integer' }, required: false },
                { name: 'dayNumber', in: 'query', schema: { type: 'integer' }, required: false }
            ],
            responses: {
                '200': {
                    description: 'List of capacities',
                    content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/ResourceDailyCapacity' } } } }
                }
            }
        },
        post: {
            summary: 'Create resource daily capacity',
            description: 'Create a new resource daily capacity (SUPER_ADMIN/ADMIN only).',
            tags: ['ResourceDailyCapacity'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ResourceDailyCapacity' }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Capacity created',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/ResourceDailyCapacity' } } }
                }
            }
        }
    },
    '/api/resource-daily-capacity/{id}': {
        get: {
            summary: 'Get resource daily capacity',
            description: 'Get resource daily capacity by ID.',
            tags: ['ResourceDailyCapacity'],
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', schema: { type: 'integer' }, required: true }
            ],
            responses: {
                '200': {
                    description: 'Capacity',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/ResourceDailyCapacity' } } }
                },
                '404': {
                    description: 'Not found',
                    content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' } } } } }
                }
            }
        },
        put: {
            summary: 'Update resource daily capacity',
            description: 'Update resource daily capacity (SUPER_ADMIN/ADMIN only).',
            tags: ['ResourceDailyCapacity'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ResourceDailyCapacity' }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Capacity updated',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/ResourceDailyCapacity' } } }
                }
            }
        },
        delete: {
            summary: 'Delete resource daily capacity',
            description: 'Delete resource daily capacity (SUPER_ADMIN/ADMIN only).',
            tags: ['ResourceDailyCapacity'],
            security: [{ BearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Capacity deleted',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/ResourceDailyCapacity' } } }
                }
            }
        }
    }
};
