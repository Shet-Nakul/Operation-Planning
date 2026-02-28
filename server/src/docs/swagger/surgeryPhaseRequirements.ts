import { OpenAPIV3 } from 'openapi-types';

export const surgeryPhaseRequirementsDocs: OpenAPIV3.PathsObject = {
  '/api/surgery-phase-requirements': {
    get: {
      summary: 'List surgery phase requirements',
      description: 'Get a list of surgery phase requirements.',
      tags: ['SurgeryPhaseRequirements'],
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          description: 'List of surgery phase requirements',
          content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/SurgeryPhaseRequirement' } } } }
        }
      }
    },
    post: {
      summary: 'Create surgery phase requirement',
      description: 'Create a new surgery phase requirement (SUPER_ADMIN/ADMIN only).',
      tags: ['SurgeryPhaseRequirements'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SurgeryPhaseRequirement' }
          }
        }
      },
      responses: {
        '201': {
          description: 'Surgery phase requirement created',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SurgeryPhaseRequirement' } } }
        }
      }
    }
  },
  '/api/surgery-phase-requirements/{id}': {
    get: {
      summary: 'Get surgery phase requirement',
      description: 'Get surgery phase requirement by ID.',
      tags: ['SurgeryPhaseRequirements'],
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', schema: { type: 'integer' }, required: true }
      ],
      responses: {
        '200': {
          description: 'Surgery phase requirement',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SurgeryPhaseRequirement' } } }
        },
        '404': {
          description: 'Not found',
          content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' } } } } }
        }
      }
    },
    put: {
      summary: 'Update surgery phase requirement',
      description: 'Update surgery phase requirement (SUPER_ADMIN/ADMIN only).',
      tags: ['SurgeryPhaseRequirements'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SurgeryPhaseRequirement' }
          }
        }
      },
      responses: {
        '200': {
          description: 'Surgery phase requirement updated',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SurgeryPhaseRequirement' } } }
        }
      }
    },
    delete: {
      summary: 'Delete surgery phase requirement',
      description: 'Delete surgery phase requirement (SUPER_ADMIN/ADMIN only).',
      tags: ['SurgeryPhaseRequirements'],
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          description: 'Surgery phase requirement deleted',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SurgeryPhaseRequirement' } } }
        }
      }
    }
  }
};
