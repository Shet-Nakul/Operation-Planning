import { OpenAPIV3 } from 'openapi-types';

export const operationTypesDocs: OpenAPIV3.PathsObject = {
  '/api/operation-types': {
    get: {
      summary: 'List operation types',
      description: 'Get a list of operation types.',
      tags: ['OperationTypes'],
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: 'search', in: 'query', schema: { type: 'string' }, required: false }
      ],
      responses: {
        '200': {
          description: 'List of operation types',
          content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/OperationType' } } } }
        }
      }
    },
    post: {
      summary: 'Create operation type',
      description: 'Create a new operation type (SUPER_ADMIN/ADMIN only).',
      tags: ['OperationTypes'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/OperationType' }
          }
        }
      },
      responses: {
        '201': {
          description: 'Operation type created',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/OperationType' } } }
        }
      }
    }
  },
  '/api/operation-types/{id}': {
    get: {
      summary: 'Get operation type',
      description: 'Get operation type by ID.',
      tags: ['OperationTypes'],
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', schema: { type: 'integer' }, required: true }
      ],
      responses: {
        '200': {
          description: 'Operation type',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/OperationType' } } }
        },
        '404': {
          description: 'Not found',
          content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' } } } } }
        }
      }
    },
    put: {
      summary: 'Update operation type',
      description: 'Update operation type (SUPER_ADMIN/ADMIN only).',
      tags: ['OperationTypes'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/OperationType' }
          }
        }
      },
      responses: {
        '200': {
          description: 'Operation type updated',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/OperationType' } } }
        }
      }
    },
    delete: {
      summary: 'Delete operation type',
      description: 'Delete operation type (SUPER_ADMIN/ADMIN only).',
      tags: ['OperationTypes'],
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          description: 'Operation type deleted',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/OperationType' } } }
        }
      }
    }
  }
};
