import { OpenAPIV3 } from 'openapi-types';

export const resourceAvailabilityWindowsDocs: OpenAPIV3.PathsObject = {
  '/api/resource-availability-windows': {
    get: {
      summary: 'List resource availability windows',
      description: 'Get a list of resource availability windows.',
      tags: ['ResourceAvailabilityWindows'],
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: 'dailyCapacityId', in: 'query', schema: { type: 'integer' }, required: false },
        { name: 'isExtended', in: 'query', schema: { type: 'boolean' }, required: false }
      ],
      responses: {
        '200': {
          description: 'List of windows',
          content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/ResourceAvailabilityWindow' } } } }
        }
      }
    },
    post: {
      summary: 'Create resource availability window',
      description: 'Create a new resource availability window (SUPER_ADMIN/ADMIN only).',
      tags: ['ResourceAvailabilityWindows'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ResourceAvailabilityWindow' }
          }
        }
      },
      responses: {
        '201': {
          description: 'Window created',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ResourceAvailabilityWindow' } } }
        }
      }
    }
  },
  '/api/resource-availability-windows/{id}': {
    get: {
      summary: 'Get resource availability window',
      description: 'Get resource availability window by ID.',
      tags: ['ResourceAvailabilityWindows'],
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', schema: { type: 'integer' }, required: true }
      ],
      responses: {
        '200': {
          description: 'Window',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ResourceAvailabilityWindow' } } }
        },
        '404': {
          description: 'Not found',
          content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' } } } } }
        }
      }
    },
    put: {
      summary: 'Update resource availability window',
      description: 'Update resource availability window (SUPER_ADMIN/ADMIN only).',
      tags: ['ResourceAvailabilityWindows'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ResourceAvailabilityWindow' }
          }
        }
      },
      responses: {
        '200': {
          description: 'Window updated',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ResourceAvailabilityWindow' } } }
        }
      }
    },
    delete: {
      summary: 'Delete resource availability window',
      description: 'Delete resource availability window (SUPER_ADMIN/ADMIN only).',
      tags: ['ResourceAvailabilityWindows'],
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          description: 'Window deleted',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ResourceAvailabilityWindow' } } }
        }
      }
    }
  }
};
