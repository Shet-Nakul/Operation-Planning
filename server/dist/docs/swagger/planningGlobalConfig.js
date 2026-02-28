"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planningGlobalConfigDocs = void 0;
exports.planningGlobalConfigDocs = {
    '/api/planning-global-config': {
        get: {
            summary: 'List planning global configs',
            description: 'Get a list of planning global configs.',
            tags: ['PlanningGlobalConfig'],
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'organizationId', in: 'query', schema: { type: 'integer' }, required: false },
                { name: 'isActive', in: 'query', schema: { type: 'boolean' }, required: false }
            ],
            responses: {
                '200': {
                    description: 'List of configs',
                    content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/PlanningGlobalConfig' } } } }
                }
            }
        },
        post: {
            summary: 'Create planning global config',
            description: 'Create a new planning global config (SUPER_ADMIN/ADMIN only).',
            tags: ['PlanningGlobalConfig'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/PlanningGlobalConfig' }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Config created',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/PlanningGlobalConfig' } } }
                }
            }
        }
    },
    '/api/planning-global-config/{id}': {
        get: {
            summary: 'Get planning global config',
            description: 'Get planning global config by ID.',
            tags: ['PlanningGlobalConfig'],
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', schema: { type: 'integer' }, required: true }
            ],
            responses: {
                '200': {
                    description: 'Config',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/PlanningGlobalConfig' } } }
                },
                '404': {
                    description: 'Not found',
                    content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' } } } } }
                }
            }
        },
        put: {
            summary: 'Update planning global config',
            description: 'Update planning global config (SUPER_ADMIN/ADMIN only).',
            tags: ['PlanningGlobalConfig'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/PlanningGlobalConfig' }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Config updated',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/PlanningGlobalConfig' } } }
                }
            }
        },
        delete: {
            summary: 'Delete planning global config',
            description: 'Delete planning global config (SUPER_ADMIN/ADMIN only).',
            tags: ['PlanningGlobalConfig'],
            security: [{ BearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Config deleted',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/PlanningGlobalConfig' } } }
                }
            }
        }
    }
};
