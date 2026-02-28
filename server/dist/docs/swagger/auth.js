"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authDocs = void 0;
exports.authDocs = {
    '/api/auth/login': {
        post: {
            summary: 'User login',
            description: 'Authenticate user and return JWT access token.',
            tags: ['Auth'],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                email: { type: 'string', example: 'user@example.com' },
                                password: { type: 'string', example: 'password123' }
                            },
                            required: ['email', 'password']
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Successful login',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    accessToken: { type: 'string' },
                                    user: { $ref: '#/components/schemas/User' }
                                }
                            }
                        }
                    }
                },
                '401': {
                    description: 'Invalid credentials',
                    content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' } } } } }
                }
            }
        }
    },
    '/api/auth/register': {
        post: {
            summary: 'Register user',
            description: 'Register a new user (ADMIN/SUPER_ADMIN only).',
            tags: ['Auth'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                email: { type: 'string' },
                                password: { type: 'string' },
                                role_id: { type: 'integer' },
                                organization_id: { type: 'integer' },
                                first_name: { type: 'string' },
                                last_name: { type: 'string' }
                            },
                            required: ['email', 'password', 'role_id', 'first_name']
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'User registered',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    user: { $ref: '#/components/schemas/User' }
                                }
                            }
                        }
                    }
                },
                '403': {
                    description: 'Forbidden',
                    content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' } } } } }
                }
            }
        }
    },
    '/api/auth/logout': {
        post: {
            summary: 'Logout user',
            description: 'Logout user and record audit log.',
            tags: ['Auth'],
            security: [{ BearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Logged out',
                    content: {
                        'application/json': {
                            schema: { type: 'object', properties: { message: { type: 'string' } } }
                        }
                    }
                },
                '400': {
                    description: 'Bad request',
                    content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' } } } } }
                }
            }
        }
    }
};
