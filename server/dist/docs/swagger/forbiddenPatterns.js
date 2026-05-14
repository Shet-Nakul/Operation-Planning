"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forbiddenPatternsDocs = void 0;
exports.forbiddenPatternsDocs = {
    '/api/catalogs/pattern': {
        post: {
            tags: ['ForbiddenPatterns'],
            summary: 'Create Forbidden Pattern',
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                organization_id: { type: 'number' },
                                scope: { type: 'string', example: 'GLOBAL' },
                                applies_to: { type: 'string', example: 'ALL_CONTRACT_TYPES' },
                                forbidden_patterns: { type: 'array', items: { type: 'object' } },
                                metadata: { type: 'object' },
                            },
                            required: ['organization_id', 'forbidden_patterns'],
                        },
                    },
                },
            },
            responses: { 201: { description: 'Created' } },
        },
        get: {
            tags: ['ForbiddenPatterns'],
            summary: 'Get Forbidden Patterns',
            responses: { 200: { description: 'Success' } },
        },
    },
    '/api/catalogs/pattern/{id}': {
        put: {
            tags: ['ForbiddenPatterns'],
            summary: 'Update Forbidden Pattern',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                scope: { type: 'string' },
                                applies_to: { type: 'string' },
                                forbidden_patterns: { type: 'array', items: { type: 'object' } },
                                metadata: { type: 'object' },
                            },
                        },
                    },
                },
            },
            responses: { 200: { description: 'Updated' } },
        },
        delete: {
            tags: ['ForbiddenPatterns'],
            summary: 'Delete Forbidden Pattern',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
            responses: { 204: { description: 'Deleted' } },
        },
    },
};
