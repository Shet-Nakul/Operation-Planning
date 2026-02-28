"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationsDocs = void 0;
exports.organizationsDocs = {
    '/api/organizations': {
        get: {
            summary: 'List organizations',
            description: 'Get a paginated list of organizations.',
            tags: ['Organizations'],
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'skip', in: 'query', schema: { type: 'integer' }, required: false },
                { name: 'take', in: 'query', schema: { type: 'integer' }, required: false },
                { name: 'search', in: 'query', schema: { type: 'string' }, required: false }
            ],
            responses: {
                '200': {
                    description: 'List of organizations',
                    content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Organization' } } } }
                }
            }
        },
        post: {
            summary: 'Create organization',
            description: 'Create a new organization (SUPER_ADMIN only).',
            tags: ['Organizations'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Organization' }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Organization created',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Organization' } } }
                }
            }
        }
    },
    '/api/organizations/{id}': {
        get: {
            summary: 'Get organization',
            description: 'Get organization by ID.',
            tags: ['Organizations'],
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', schema: { type: 'integer' }, required: true }
            ],
            responses: {
                '200': {
                    description: 'Organization',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Organization' } } }
                },
                '404': {
                    description: 'Not found',
                    content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' } } } } }
                }
            }
        },
        put: {
            summary: 'Update organization',
            description: 'Update organization (SUPER_ADMIN only).',
            tags: ['Organizations'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Organization' }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Organization updated',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Organization' } } }
                }
            }
        },
        delete: {
            summary: 'Delete organization',
            description: 'Delete organization (SUPER_ADMIN only).',
            tags: ['Organizations'],
            security: [{ BearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Organization deleted',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Organization' } } }
                }
            }
        }
    }
};
