import { OpenAPIV3 } from 'openapi-types';

export const rolesDocs: OpenAPIV3.PathsObject = {
  '/api/roles': {
    get: {
      summary: 'List roles',
      description: 'Get a list of roles.',
      tags: ['Roles'],
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          description: 'List of roles',
          content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Role' } } } }
        }
      }
    },
    post: {
      summary: 'Create role',
      description: 'Create a new role (SUPER_ADMIN only).',
      tags: ['Roles'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Role' }
          }
        }
      },
      responses: {
        '201': {
          description: 'Role created',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Role' } } }
        }
      }
    }
  },
  '/api/roles/{id}': {
    get: {
      summary: 'Get role',
      description: 'Get role by ID.',
      tags: ['Roles'],
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', schema: { type: 'integer' }, required: true }
      ],
      responses: {
        '200': {
          description: 'Role',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Role' } } }
        },
        '404': {
          description: 'Not found',
          content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' } } } } }
        }
      }
    },
    put: {
      summary: 'Update role',
      description: 'Update role (SUPER_ADMIN only).',
      tags: ['Roles'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Role' }
          }
        }
      },
      responses: {
        '200': {
          description: 'Role updated',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Role' } } }
        }
      }
    },
    delete: {
      summary: 'Delete role',
      description: 'Delete role (SUPER_ADMIN only).',
      tags: ['Roles'],
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          description: 'Role deleted',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Role' } } }
        }
      }
    }
  }
};
