import { OpenAPIV3 } from 'openapi-types';

export const phaseRequirementsDocs: OpenAPIV3.PathsObject = {
  '/api/phases': {
    get: {
      summary: 'List phase requirements',
      description: 'Get a list of phase requirements.',
      tags: ['PhaseRequirements'],
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: 'search', in: 'query', schema: { type: 'string' }, required: false }
      ],
      responses: {
        '200': {
          description: 'List of phase requirements',
          content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/PhaseRequirement' } } } }
        }
      }
    },
    post: {
      summary: 'Create phase requirement',
      description: 'Create a new phase requirement (SUPER_ADMIN/ADMIN only).',
      tags: ['PhaseRequirements'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PhaseRequirement' }
          }
        }
      },
      responses: {
        '201': {
          description: 'Phase requirement created',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PhaseRequirement' } } }
        }
      }
    }
  },
  '/api/phases/{id}': {
    get: {
      summary: 'Get phase requirement',
      description: 'Get phase requirement by ID.',
      tags: ['PhaseRequirements'],
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', schema: { type: 'integer' }, required: true }
      ],
      responses: {
        '200': {
          description: 'Phase requirement',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PhaseRequirement' } } }
        },
        '404': {
          description: 'Not found',
          content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' } } } } }
        }
      }
    },
    put: {
      summary: 'Update phase requirement',
      description: 'Update phase requirement (SUPER_ADMIN/ADMIN only).',
      tags: ['PhaseRequirements'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PhaseRequirement' }
          }
        }
      },
      responses: {
        '200': {
          description: 'Phase requirement updated',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PhaseRequirement' } } }
        }
      }
    },
    delete: {
      summary: 'Delete phase requirement',
      description: 'Delete phase requirement (SUPER_ADMIN/ADMIN only).',
      tags: ['PhaseRequirements'],
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          description: 'Phase requirement deleted',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PhaseRequirement' } } }
        }
      }
    }
  }
};
