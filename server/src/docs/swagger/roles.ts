import { OpenAPIV3 } from 'openapi-types';

export const rolesDocs: OpenAPIV3.PathsObject = {
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
  '/api/roles/{id}': {
    put: {
      tags: ['Roles'],
      summary: 'Update Role',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
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
      tags: ['Roles'],
      summary: 'Delete Role',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: {
        204: { description: 'Deleted' },
      },
    },
  },
};
