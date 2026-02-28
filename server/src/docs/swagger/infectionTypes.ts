import { OpenAPIV3 } from 'openapi-types';

export const infectionTypesDocs: OpenAPIV3.PathsObject = {
  '/api/infection-types': {
    get: {
      summary: 'List infection types',
      description: 'Get a list of infection types.',
      tags: ['InfectionTypes'],
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          description: 'List of infection types',
          content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/InfectionType' } } } }
        }
      }
    },
    post: {
      summary: 'Create infection type',
      description: 'Create a new infection type (SUPER_ADMIN/ADMIN only).',
      tags: ['InfectionTypes'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/InfectionType' }
          }
        }
      },
      responses: {
        '201': {
          description: 'Infection type created',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/InfectionType' } } }
        }
      }
    }
  },
  '/api/infection-types/{id}': {
    get: {
      summary: 'Get infection type',
      description: 'Get infection type by ID.',
      tags: ['InfectionTypes'],
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', schema: { type: 'integer' }, required: true }
      ],
      responses: {
        '200': {
          description: 'Infection type',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/InfectionType' } } }
        },
        '404': {
          description: 'Not found',
          content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' } } } } }
        }
      }
    },
    put: {
      summary: 'Update infection type',
      description: 'Update infection type (SUPER_ADMIN/ADMIN only).',
      tags: ['InfectionTypes'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/InfectionType' }
          }
        }
      },
      responses: {
        '200': {
          description: 'Infection type updated',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/InfectionType' } } }
        }
      }
    },
    delete: {
      summary: 'Delete infection type',
      description: 'Delete infection type (SUPER_ADMIN/ADMIN only).',
      tags: ['InfectionTypes'],
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          description: 'Infection type deleted',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/InfectionType' } } }
        }
      }
    }
  }
};
