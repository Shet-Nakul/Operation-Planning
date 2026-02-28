"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersDocs = void 0;
exports.usersDocs = {
    '/api/users': {
        get: {
            summary: 'List users',
            description: 'Get a paginated list of users.',
            tags: ['Users'],
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'skip', in: 'query', schema: { type: 'integer' }, required: false },
                { name: 'take', in: 'query', schema: { type: 'integer' }, required: false },
                { name: 'search', in: 'query', schema: { type: 'string' }, required: false }
            ],
            responses: {
                '200': {
                    description: 'List of users',
                    content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } }
                }
            }
        },
        post: {
            summary: 'Create user',
            description: 'Create a new user (SUPER_ADMIN/ADMIN only).',
            tags: ['Users'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/User' }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'User created',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } }
                }
            }
        }
    },
    '/api/users/{id}': {
        get: {
            summary: 'Get user',
            description: 'Get user by ID.',
            tags: ['Users'],
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', schema: { type: 'integer' }, required: true }
            ],
            responses: {
                '200': {
                    description: 'User',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } }
                },
                '404': {
                    description: 'Not found',
                    content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' } } } } }
                }
            }
        },
        put: {
            summary: 'Update user',
            description: 'Update user (SUPER_ADMIN/ADMIN only).',
            tags: ['Users'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/User' }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'User updated',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } }
                }
            }
        },
        delete: {
            summary: 'Delete user',
            description: 'Delete user (SUPER_ADMIN/ADMIN only).',
            tags: ['Users'],
            security: [{ BearerAuth: [] }],
            responses: {
                '200': {
                    description: 'User deleted',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } }
                }
            }
        }
    }
};
