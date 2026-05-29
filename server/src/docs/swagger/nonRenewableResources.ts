export const nonRenewableResourcesDocs = {
  '/api/non-renewable-resources': {
    post: {
      tags: ['Non-Renewable Resources'],
      summary: 'Create non-renewable resource',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                organization_id: { type: 'number' },
                name: { type: 'string' },
                spec: { type: 'string' },
                category: { type: 'string' },
                uom: { type: 'string' },
                stockpile_qty: { type: 'number' },
                min_required_qty: { type: 'number' },
                status: { type: 'string' }
              },
              required: ['organization_id', 'name', 'category', 'uom', 'stockpile_qty', 'min_required_qty']
            }
          }
        }
      },
      responses: {
        201: { description: 'Created' }
      }
    },
    get: {
      tags: ['Non-Renewable Resources'],
      summary: 'Read all non-renewable resources with optional search',
      parameters: [
        { name: 'query', in: 'query', schema: { type: 'string' }, description: 'Search by name' },
        { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by category' },
        { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Filter by status' },
        { name: 'limit', in: 'query', schema: { type: 'number' }, description: 'Limit results' },
        { name: 'orgId', in: 'query', schema: { type: 'number' }, description: 'Organization ID' }
      ],
      responses: {
        200: { description: 'List of resources' }
      }
    }
  },
  '/api/non-renewable-resources/{resource_id}': {
    get: {
      tags: ['Non-Renewable Resources'],
      summary: 'Read one non-renewable resource by id',
      parameters: [{ name: 'resource_id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Resource details' },
        404: { description: 'Not found' }
      }
    },
    patch: {
      tags: ['Non-Renewable Resources'],
      summary: 'Update non-renewable resource',
      parameters: [{ name: 'resource_id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                spec: { type: 'string' },
                category: { type: 'string' },
                uom: { type: 'string' },
                stockpile_qty: { type: 'number' },
                min_required_qty: { type: 'number' },
                status: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Updated' }
      }
    },
    delete: {
      tags: ['Non-Renewable Resources'],
      summary: 'Delete non-renewable resource',
      parameters: [{ name: 'resource_id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Deleted' }
      }
    }
  }
};
