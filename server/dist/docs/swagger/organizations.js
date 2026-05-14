"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationsDocs = void 0;
exports.organizationsDocs = {
    '/api/organizations': {
        post: {
            tags: ['Organizations'],
            summary: 'Create Organization',
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                contact_number: { type: 'string' },
                                contact_email: { type: 'string' },
                            },
                            required: ['name'],
                        },
                    },
                },
            },
            responses: {
                201: { description: 'Created' },
            },
        },
        get: {
            tags: ['Organizations'],
            summary: 'Get Organizations',
            responses: {
                200: { description: 'Success' },
            },
        },
    },
    '/api/organizations/{id}': {
        get: {
            tags: ['Organizations'],
            summary: 'Get Organization By ID',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
            responses: {
                200: { description: 'Success' },
            },
        },
        put: {
            tags: ['Organizations'],
            summary: 'Update Organization',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                contact_number: { type: 'string' },
                                contact_email: { type: 'string' },
                                status: { type: 'string' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: 'Updated' },
            },
        },
        delete: {
            tags: ['Organizations'],
            summary: 'Delete Organization',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
            responses: {
                204: { description: 'Deleted' },
            },
        },
    },
};
