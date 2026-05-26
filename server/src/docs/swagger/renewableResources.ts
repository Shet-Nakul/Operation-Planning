export const renewableResourcesDocs = {
  '/api/resources/pools': {
    get: {
      tags: ['RenewableResources'],
      summary: 'List all renewable resource pools',
      parameters: [
        { name: 'resource_type', in: 'query', schema: { type: 'string' }, description: 'Filter by type (BED, EQUIPMENT, ROOM, DEVICE, VEHICLE)' },
        { name: 'department', in: 'query', schema: { type: 'string' }, description: 'Filter by department' },
        { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Filter by status' },
        { name: 'orgId', in: 'query', schema: { type: 'number' } },
      ],
      responses: {
        200: { description: 'Success' },
      },
    },
    post: {
      tags: ['RenewableResources'],
      summary: 'Create a new renewable resource pool',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                organization_id: { type: 'number' },
                pool_name: { type: 'string', example: 'ICU Bed Pool' },
                resource_type: { type: 'string', enum: ['BED', 'EQUIPMENT', 'ROOM', 'DEVICE', 'VEHICLE'] },
                department: { type: 'string' },
                location: { type: 'string' },
                total_capacity: { type: 'number' },
                unit_prefix: { type: 'string', example: 'ICU' },
                default_variant: { type: 'string' },
                default_attributes: { type: 'object' },
              },
              required: ['organization_id', 'pool_name', 'resource_type', 'total_capacity'],
            },
          },
        },
      },
      responses: {
        201: { description: 'Created' },
      },
    },
  },
  '/api/resources/pools/{pool_id}': {
    get: {
      tags: ['RenewableResources'],
      summary: 'Get detailed resource pool with individual unit states',
      parameters: [{ name: 'pool_id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Detailed pool information' },
        404: { description: 'Pool not found' },
      },
    },
  },
  '/api/resources/pools/{pool_id}/capacity': {
    put: {
      tags: ['RenewableResources'],
      summary: 'Update total pool capacity',
      parameters: [{ name: 'pool_id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                total_capacity: { type: 'number' },
                reason: { type: 'string' },
                effective_from: { type: 'string' },
              },
              required: ['total_capacity'],
            },
          },
        },
      },
      responses: {
        200: { description: 'Capacity updated' },
      },
    },
  },
  '/api/resources/pools/{pool_id}/health': {
    get: {
      tags: ['RenewableResources'],
      summary: 'Get resource health metrics',
      parameters: [{ name: 'pool_id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Health metrics' },
      },
    },
  },
  '/api/resources/pools/{pool_id}/units': {
    post: {
      tags: ['RenewableResources'],
      summary: 'Add new resource units to an existing pool',
      parameters: [{ name: 'pool_id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                units: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      unit_id: { type: 'string' },
                      variant: { type: 'string' },
                      attributes: { type: 'object' },
                    },
                    required: ['unit_id'],
                  },
                },
              },
              required: ['units'],
            },
          },
        },
      },
      responses: {
        200: { description: 'Units added' },
      },
    },
  },
  '/api/resources/units/{unit_id}': {
    patch: {
      tags: ['RenewableResources'],
      summary: "Edit an individual resource unit's state",
      parameters: [{ name: 'unit_id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                variant: { type: 'string' },
                attributes: { type: 'object' },
                status: { type: 'string' },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Unit updated' },
      },
    },
  },
};
