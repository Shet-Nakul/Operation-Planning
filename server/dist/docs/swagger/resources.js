"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resourcesDocs = void 0;
exports.resourcesDocs = {
    '/api/resources': {
        get: {
            summary: 'List resources',
            description: 'Get a paginated list of resources.',
            tags: ['Resources'],
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'skip', in: 'query', schema: { type: 'integer' }, required: false },
                { name: 'take', in: 'query', schema: { type: 'integer' }, required: false },
                { name: 'search', in: 'query', schema: { type: 'string' }, required: false }
            ],
            responses: {
                '200': {
                    description: 'List of resources',
                    content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Resource' } } } }
                }
            }
        },
        post: {
            summary: 'Create resource',
            description: 'Create a new resource (SUPER_ADMIN/ADMIN only).',
            tags: ['Resources'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Resource' }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Resource created',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Resource' } } }
                }
            }
        }
    },
    '/api/resources/{id}': {
        get: {
            summary: 'Get resource',
            description: 'Get resource by ID.',
            tags: ['Resources'],
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', schema: { type: 'integer' }, required: true }
            ],
            responses: {
                '200': {
                    description: 'Resource',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Resource' } } }
                },
                '404': {
                    description: 'Not found',
                    content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' } } } } }
                }
            }
        },
        put: {
            summary: 'Update resource',
            description: 'Update resource (SUPER_ADMIN/ADMIN only).',
            tags: ['Resources'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Resource' }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Resource updated',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Resource' } } }
                }
            }
        },
        delete: {
            summary: 'Delete resource',
            description: 'Delete resource (SUPER_ADMIN/ADMIN only).',
            tags: ['Resources'],
            security: [{ BearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Resource deleted',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Resource' } } }
                }
            }
        }
    }
};
