import { OpenAPIV3 } from 'openapi-types';

export const usersDocs: OpenAPIV3.PathsObject = {
  '/api/users': {
    get: {
      tags: ['Users'],
      summary: 'Get Users',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } },
        { name: 'orgId', in: 'query', schema: { type: 'number' } },
      ],
      responses: {
        200: { description: 'Success' },
      },
    },
    post: {
      tags: ['Users'],
      summary: 'Create User',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                organization_id: { type: 'number' },
                role_id: { type: 'number' },
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                email: { type: 'string' },
                password: { type: 'string' },
                is_active: { type: 'boolean' },
              },
              required: ['role_id', 'first_name', 'email', 'password'],
            },
          },
        },
      },
      responses: {
        201: { description: 'Created' },
      },
    },
  },
  '/api/users/{id}': {
    get: {
      tags: ['Users'],
      summary: 'Get User By ID',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: {
        200: { description: 'Success' },
      },
    },
    put: {
      tags: ['Users'],
      summary: 'Update User',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                organization_id: { type: 'number' },
                role_id: { type: 'number' },
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                email: { type: 'string' },
                password: { type: 'string' },
                is_active: { type: 'boolean' },
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
      tags: ['Users'],
      summary: 'Delete User',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: {
        204: { description: 'Deleted' },
      },
    },
  },
};
