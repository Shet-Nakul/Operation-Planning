"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesDocs = void 0;
exports.rolesDocs = {
    '/api/roles': {
        get: {
            tags: ['Roles'],
            summary: 'Get Roles',
            responses: {
                200: { description: 'Success' },
            },
        },
        post: {
            tags: ['Roles'],
            summary: 'Create Role',
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                description: { type: 'string' },
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
    },
};
