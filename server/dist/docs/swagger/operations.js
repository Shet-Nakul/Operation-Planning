"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operationsDocs = void 0;
exports.operationsDocs = {
    '/api/operations': {
        get: {
            summary: 'List operations',
            description: 'Get a paginated list of operations.',
            tags: ['Operations'],
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'skip', in: 'query', schema: { type: 'integer' }, required: false },
                { name: 'take', in: 'query', schema: { type: 'integer' }, required: false },
                { name: 'search', in: 'query', schema: { type: 'string' }, required: false },
                { name: 'status', in: 'query', schema: { type: 'string' }, required: false }
            ],
            responses: {
                '200': {
                    description: 'List of operations',
                    content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Operation' } } } }
                }
            }
        },
        post: {
            summary: 'Create operation',
            description: 'Create a new operation (SUPER_ADMIN/ADMIN only).',
            tags: ['Operations'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Operation' }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Operation created',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Operation' } } }
                }
            }
        }
    },
    '/api/operations/{id}': {
        get: {
            summary: 'Get operation',
            description: 'Get operation by ID.',
            tags: ['Operations'],
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', schema: { type: 'integer' }, required: true }
            ],
            responses: {
                '200': {
                    description: 'Operation',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Operation' } } }
                },
                '404': {
                    description: 'Not found',
                    content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' } } } } }
                }
            }
        },
        put: {
            summary: 'Update operation',
            description: 'Update operation (SUPER_ADMIN/ADMIN only).',
            tags: ['Operations'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Operation' }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Operation updated',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Operation' } } }
                }
            }
        },
        delete: {
            summary: 'Delete operation',
            description: 'Delete operation (SUPER_ADMIN/ADMIN only).',
            tags: ['Operations'],
            security: [{ BearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Operation deleted',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Operation' } } }
                }
            }
        }
    }
};
