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
                weekly_template: {
                  type: 'object',
                  description: 'Operating hours per day. Each day is an object with `hours`: a list of [start, end] pairs (24h HH:mm). Empty hours list = closed.',
                  properties: {
                    monday:    { type: 'object', properties: { hours: { type: 'array', items: { type: 'array', items: { type: 'string' } } } } },
                    tuesday:   { type: 'object', properties: { hours: { type: 'array', items: { type: 'array', items: { type: 'string' } } } } },
                    wednesday: { type: 'object', properties: { hours: { type: 'array', items: { type: 'array', items: { type: 'string' } } } } },
                    thursday:  { type: 'object', properties: { hours: { type: 'array', items: { type: 'array', items: { type: 'string' } } } } },
                    friday:    { type: 'object', properties: { hours: { type: 'array', items: { type: 'array', items: { type: 'string' } } } } },
                    saturday:  { type: 'object', properties: { hours: { type: 'array', items: { type: 'array', items: { type: 'string' } } } } },
                    sunday:    { type: 'object', properties: { hours: { type: 'array', items: { type: 'array', items: { type: 'string' } } } } },
                  },
                  example: {
                    monday:    { hours: [['08:00', '16:00']] },
                    tuesday:   { hours: [['08:00', '16:00']] },
                    wednesday: { hours: [['08:00', '16:00']] },
                    thursday:  { hours: [['08:00', '16:00']] },
                    friday:    { hours: [['08:00', '16:00']] },
                    saturday:  { hours: [] },
                    sunday:    { hours: [] },
                  },
                },
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
  '/api/resources/pools/{pool_id}/weekly_template': {
    put: {
      tags: ['RenewableResources'],
      summary: 'Set pool open hours for each day of the week',
      description: 'Each day is an object with `hours`: a list of [start, end] pairs (24h HH:mm). Pass `{"hours":[]}` for a day to mark it as closed.',
      parameters: [{ name: 'pool_id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                weekly_template: {
                  type: 'object',
                  properties: {
                    monday:    { type: 'object', properties: { hours: { type: 'array', items: { type: 'array', items: { type: 'string' } } } } },
                    tuesday:   { type: 'object', properties: { hours: { type: 'array', items: { type: 'array', items: { type: 'string' } } } } },
                    wednesday: { type: 'object', properties: { hours: { type: 'array', items: { type: 'array', items: { type: 'string' } } } } },
                    thursday:  { type: 'object', properties: { hours: { type: 'array', items: { type: 'array', items: { type: 'string' } } } } },
                    friday:    { type: 'object', properties: { hours: { type: 'array', items: { type: 'array', items: { type: 'string' } } } } },
                    saturday:  { type: 'object', properties: { hours: { type: 'array', items: { type: 'array', items: { type: 'string' } } } } },
                    sunday:    { type: 'object', properties: { hours: { type: 'array', items: { type: 'array', items: { type: 'string' } } } } },
                  },
                  example: {
                    monday:    { hours: [['08:00', '16:00']] },
                    tuesday:   { hours: [['08:00', '16:00']] },
                    wednesday: { hours: [['08:00', '16:00']] },
                    thursday:  { hours: [['08:00', '16:00']] },
                    friday:    { hours: [['08:00', '16:00']] },
                    saturday:  { hours: [['09:00', '14:00']] },
                    sunday:    { hours: [] },
                  },
                },
              },
              required: ['weekly_template'],
            },
          },
        },
      },
      responses: {
        200: { description: 'Weekly template updated' },
        404: { description: 'Pool not found' },
      },
    },
  },
  '/api/resources/pools/{pool_id}/reservations': {
    get: {
      tags: ['RenewableResources'],
      summary: 'List reservations for a pool',
      parameters: [{ name: 'pool_id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'List of reservations' }, 404: { description: 'Pool not found' } },
    },
    post: {
      tags: ['RenewableResources'],
      summary: 'Add a reservation for a specific resource in the pool',
      description: 'Reserves a pool resource (unit) for a time window. Each reservation is assigned a server-generated `id`.',
      parameters: [{ name: 'pool_id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                resource_id: { type: 'string', example: 'OR-001', description: 'unit_id of the resource being reserved' },
                start: { type: 'string', example: '2026-07-02T10:00:00' },
                end: { type: 'string', example: '2026-07-05T12:00:00' },
                type: { type: 'string', example: 'patient', description: '"patient" | "maintenance" | custom string' },
              },
              required: ['resource_id', 'start', 'end', 'type'],
            },
          },
        },
      },
      responses: { 201: { description: 'Reservation created' }, 400: { description: 'Validation error' }, 404: { description: 'Pool not found' } },
    },
  },
  '/api/resources/pools/{pool_id}/reservations/{reservation_id}': {
    delete: {
      tags: ['RenewableResources'],
      summary: 'Remove a reservation from a pool',
      parameters: [
        { name: 'pool_id', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'reservation_id', in: 'path', required: true, schema: { type: 'string' }, description: 'The `id` returned when the reservation was created' },
      ],
      responses: { 200: { description: 'Reservation deleted' }, 404: { description: 'Pool or reservation not found' } },
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
