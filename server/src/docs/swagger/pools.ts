export const poolsDocs = {
  '/api/pools': {
    get: {
      tags: ['Pools'],
      summary: 'List all resource pools',
      parameters: [
        {
          name: 'orgId',
          in: 'query',
          schema: { type: 'number' },
          description: 'Filter by organization ID',
        },
      ],
      responses: {
        200: {
          description: 'List of resource pools',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    pool_id: { type: 'string' },
                    pool_name: { type: 'string' },
                    department_id: { type: 'number' },
                    location: { type: 'string' },
                    primary_role: { type: 'string' },
                    total_members: { type: 'number' },
                    weekly_hours: { type: 'number' },
                    static_pct: { type: 'number' },
                    dynamic_pct: { type: 'number' },
                    metadata: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Pools'],
      summary: 'Create a new resource pool',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                organization_id: { type: 'number' },
                pool_name: { type: 'string' },
                department_id: { type: 'number' },
                location: { type: 'string' },
                primary_role: { type: 'string' },
                employees: { type: 'array', items: { type: 'string' } },
                demand_matrix: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      shift: { type: 'string' },
                      mon: { type: 'number' },
                      tue: { type: 'number' },
                      wed: { type: 'number' },
                      thu: { type: 'number' },
                      fri: { type: 'number' },
                      sat: { type: 'number' },
                      sun: { type: 'number' },
                    },
                  },
                },
              },
              required: ['organization_id', 'pool_name'],
            },
          },
        },
      },
      responses: {
        201: { description: 'Pool created' },
      },
    },
  },
  '/api/pools/{pool_id}': {
    get: {
      tags: ['Pools'],
      summary: 'Get pool detail with weekly coverage and staff',
      parameters: [
        { name: 'pool_id', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'week_start', in: 'query', schema: { type: 'string' }, description: 'ISO date string for week start' },
      ],
      responses: {
        200: { description: 'Detailed pool information' },
        404: { description: 'Pool not found' },
      },
    },
    put: {
      tags: ['Pools'],
      summary: 'Update pool details',
      parameters: [{ name: 'pool_id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                pool_name: { type: 'string' },
                department_id: { type: 'number' },
                location: { type: 'string' },
                primary_role: { type: 'string' },
                static_pct: { type: 'number' },
                dynamic_pct: { type: 'number' },
                metadata: { type: 'object' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Pool updated' },
        404: { description: 'Pool not found' },
      },
    },
  },
  '/api/pools/{pool_id}/demand': {
    get: {
      tags: ['Pools'],
      summary: 'Get current demand configuration for a pool',
      parameters: [{ name: 'pool_id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Demand configuration' },
      },
    },
    put: {
      tags: ['Pools'],
      summary: 'Update demand configuration for a pool',
      parameters: [{ name: 'pool_id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                effective_from: { type: 'string' },
                effective_to: { type: 'string' },
                demand_matrix: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      shift: { type: 'string' },
                      mon: { type: 'number' },
                      tue: { type: 'number' },
                      wed: { type: 'number' },
                      thu: { type: 'number' },
                      fri: { type: 'number' },
                      sat: { type: 'number' },
                      sun: { type: 'number' },
                    },
                  },
                },
              },
              required: ['effective_from', 'demand_matrix'],
            },
          },
        },
      },
      responses: {
        200: { description: 'Demand updated' },
      },
    },
  },
  '/api/pools/{pool_id}/shortages': {
    get: {
      tags: ['Pools'],
      summary: 'Get active shortage alerts for a pool',
      parameters: [{ name: 'pool_id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'List of shortages' },
      },
    },
  },
};
