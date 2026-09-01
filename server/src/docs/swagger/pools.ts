const demandMatrixItemSchema = {
  type: 'object',
  properties: {
    shift: { type: 'string', example: 'Morning', description: 'Shift name from the org Shift catalog' },
    monday: { type: 'number', example: 2 },
    tuesday: { type: 'number', example: 2 },
    wednesday: { type: 'number', example: 2 },
    thursday: { type: 'number', example: 2 },
    friday: { type: 'number', example: 2 },
    saturday: { type: 'number', example: 1 },
    sunday: { type: 'number', example: 1 },
  },
  required: ['shift', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
};

const blockBookingSchema = {
  type: 'object',
  description: 'Recurring weekly block — the resource is unavailable during this window every week on the specified day.',
  properties: {
    day: {
      type: 'string',
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      example: 'monday',
    },
    start: { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '08:00' },
    end: { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '12:00' },
    reason: { type: 'string', example: 'Scheduled maintenance' },
  },
  required: ['day', 'start', 'end'],
};

const reservationSchema = {
  type: 'object',
  description: 'A specific-date reservation for this resource.',
  properties: {
    reservation_id: { type: 'string', example: 'RES-TRAPOO-0001', readOnly: true },
    date: { type: 'string', format: 'date', example: '2026-08-05', description: 'YYYY-MM-DD' },
    start_time: { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '09:00' },
    end_time: { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '11:30' },
    reason: { type: 'string', example: 'Surgery TRA-SUR-0014' },
    reference_id: { type: 'string', example: 'SURG-Rob-0014', description: 'Optional external reference, e.g. a surgery_id' },
    status: {
      type: 'string',
      enum: ['ACTIVE', 'CANCELLED', 'COMPLETED'],
      default: 'ACTIVE',
    },
    created_at: { type: 'string', format: 'date-time', readOnly: true },
    updated_at: { type: 'string', format: 'date-time', readOnly: true },
  },
  required: ['date', 'start_time', 'end_time'],
};

const poolResourceResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', readOnly: true },
    resource_id: { type: 'string', example: 'TRA-BED-0001', readOnly: true },
    pool_id: { type: 'integer', readOnly: true },
    name: { type: 'string', example: 'OR Table 1' },
    description: { type: 'string', example: 'Primary operating room table' },
    status: {
      type: 'string',
      enum: ['AVAILABLE', 'RESERVED', 'BLOCKED', 'MAINTENANCE'],
      description: 'Manually-set base status. See `current_state` for the live derived value.',
      example: 'AVAILABLE',
    },
    current_state: {
      type: 'string',
      enum: ['AVAILABLE', 'RESERVED', 'BLOCKED', 'MAINTENANCE'],
      readOnly: true,
      description: [
        'Live state computed at read time (UTC):',
        '1. `RESERVED` — if any ACTIVE reservation covers the current time today.',
        '2. `BLOCKED` — if the current day+time falls in a `block_bookings` window.',
        '3. Stored `status` otherwise.',
      ].join('\n'),
      example: 'AVAILABLE',
    },
    weekly_template: {
      type: 'object',
      description: 'Day-keyed availability schedule. Each day maps to an array of `{start, end, role}` blocks (empty = off).',
      example: {
        monday: [{ start: '08:00', end: '20:00', role: 'OR Table' }],
        saturday: [],
        sunday: [],
      },
    },
    block_bookings: {
      type: 'array',
      items: blockBookingSchema,
      description: 'Recurring weekly blocks. Applied every week, overrides `status=AVAILABLE` for that window.',
      example: [{ day: 'monday', start: '12:00', end: '13:00', reason: 'Deep cleaning' }],
    },
    reservations: {
      type: 'array',
      items: reservationSchema,
      readOnly: true,
      description: 'All reservations for this resource, ordered by date then start_time.',
    },
    created_at: { type: 'string', format: 'date-time', readOnly: true },
    updated_at: { type: 'string', format: 'date-time', readOnly: true },
  },
};

/** Shared pool_type field included in every HR pool response */
const poolTypeField = {
  pool_type: {
    type: 'string',
    enum: ['human_resource_pool'],
    readOnly: true,
    description: 'Discriminator identifying this as a **human resource pool** — a named team of staff assigned to it via `pool_assignments`. Distinct from `renewable_resource_pool` (physical assets like beds/equipment).',
    example: 'human_resource_pool',
  },
};

const poolPathParam = { name: 'pool_id', in: 'path', required: true, schema: { type: 'string' }, example: 'TRA-SUR-0001' };
const resourcePathParam = { name: 'resource_id', in: 'path', required: true, schema: { type: 'string' }, example: 'TRA-BED-0001' };
const reservationPathParam = { name: 'reservation_id', in: 'path', required: true, schema: { type: 'string' }, example: 'RES-TRABET-0001' };

export const poolsDocs = {
  '/api/pools': {
    get: {
      tags: ['Human Resource Pools'],
      summary: 'List human resource pools',
      description: [
        'Returns all **human resource pools** for the organisation.',
        '',
        'A human resource pool (HR pool) is a named team of clinical staff — e.g. "Trauma Surgical Team".',
        'Staff are linked to a pool via `Staff.pool_assignments` (a JSON array), not a relational FK.',
        'Each response item includes `pool_type: "human_resource_pool"` for unambiguous client-side differentiation',
        'from `/api/resources/pools` (renewable resource pools — physical assets).',
        '',
        '**Scheduling**: pool demand matrix → `shift_requirements` in scheduling payload.',
        '**Planning**: each pool becomes a resource entry in the per-department planning payload.',
      ].join('\n'),
      parameters: [
        { name: 'orgId', in: 'query', schema: { type: 'number' }, description: 'Filter by organization ID' },
      ],
      responses: {
        200: {
          description: 'List of human resource pools',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        ...poolTypeField,
                        pool_id: { type: 'string', example: 'TRA-SUR-0001' },
                        pool_name: { type: 'string', example: 'Trauma Surgical Team' },
                        department_id: { type: 'number' },
                        location: { type: 'string' },
                        primary_role: { type: 'string', description: 'Clinical role this pool primarily covers (StaffTag name)' },
                        total_members: { type: 'number', description: 'Staff currently assigned via pool_assignments' },
                        weekly_hours: { type: 'number' },
                        static_pct: { type: 'number' },
                        dynamic_pct: { type: 'number' },
                        resources: { type: 'array', items: { type: 'string' }, description: 'Physical resource_ids belonging to this pool' },
                        metadata: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Human Resource Pools'],
      summary: 'Create a human resource pool',
      description: [
        'Creates a new **human resource pool** — a named clinical team within a department.',
        '',
        'Staff are NOT attached at creation time. They are linked later by updating their own `pool_assignments` field via `PUT /api/staff/:staff_id`.',
        '',
        '**Triggers planning auto-run** within 10 s of creation.',
        '**Triggers scheduling auto-run** within 10 s of creation.',
      ].join('\n'),
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['organization_id', 'pool_name'],
              properties: {
                organization_id: { type: 'number' },
                pool_name: { type: 'string', example: 'Trauma Surgical Team' },
                department_id: { type: 'number' },
                location: { type: 'string' },
                primary_role: { type: 'string', description: 'Primary clinical role (must match a StaffTag name)', example: 'Senior Surgeon' },
                static_pct: { type: 'number', default: 50, description: 'Target % of STATIC contract staff in this pool' },
                dynamic_pct: { type: 'number', default: 50, description: 'Target % of DYNAMIC contract staff in this pool' },
                metadata: { type: 'object' },
                demand_matrix: { type: 'array', items: demandMatrixItemSchema, description: 'Initial shift demand config (optional — can be set later via PUT /demand)' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Human resource pool created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      ...poolTypeField,
                      pool_id: { type: 'string' },
                      pool_name: { type: 'string' },
                    },
                  },
                  message: { type: 'string', example: 'Pool created successfully' },
                },
              },
            },
          },
        },
        400: { description: 'Validation error' },
        409: { description: 'Pool name already exists for this org' },
      },
    },
  },

  '/api/pools/{pool_id}': {
    get: {
      tags: ['Human Resource Pools'],
      summary: 'Get human resource pool detail',
      description: 'Returns full pool detail including assigned staff members, physical resources, weekly demand coverage, and `pool_type: "human_resource_pool"`.',
      parameters: [poolPathParam],
      responses: {
        200: {
          description: 'Detailed human resource pool',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      ...poolTypeField,
                      pool_id: { type: 'string' },
                      pool_name: { type: 'string' },
                      total_members: { type: 'number' },
                      employees: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            staff_id: { type: 'string' },
                            name: { type: 'string' },
                            role: { type: 'string' },
                            contract_type: { type: 'string', enum: ['STATIC', 'DYNAMIC'] },
                          },
                        },
                      },
                      resources: { type: 'array', description: 'Physical resources (pool_resources) attached to this pool' },
                      coverage: { type: 'object', description: 'Weekly demand vs actual coverage per shift' },
                    },
                  },
                },
              },
            },
          },
        },
        404: { description: 'Pool not found' },
      },
    },
    put: {
      tags: ['Human Resource Pools'],
      summary: 'Update a human resource pool',
      description: 'Updates pool metadata. **Triggers both planning and scheduling auto-runs** within 10 s.',
      parameters: [poolPathParam],
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
        200: {
          description: 'Pool updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { type: 'object', properties: { ...poolTypeField } },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        404: { description: 'Pool not found' },
      },
    },
  },

  '/api/pools/{pool_id}/demand': {
    get: {
      tags: ['Human Resource Pools'],
      summary: 'Get demand configuration',
      description: 'Returns the most recent shift demand config for this HR pool. The demand matrix drives `shift_requirements` in the scheduling payload.',
      parameters: [poolPathParam],
      responses: {
        200: { description: 'Most recent demand config' },
        404: { description: 'Pool or demand config not found' },
      },
    },
    put: {
      tags: ['Human Resource Pools'],
      summary: 'Update demand configuration',
      description: [
        'Creates a new demand config row (history is preserved). The shift `name` is looked up in the org Shift catalog',
        'and converted to its `alias` before being sent to the scheduling solver.',
        '',
        '**Triggers both planning and scheduling auto-runs** within 10 s.',
      ].join('\n'),
      parameters: [poolPathParam],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['effective_from', 'demand_matrix'],
              properties: {
                effective_from: { type: 'string', format: 'date', example: '2026-08-01' },
                effective_to: { type: 'string', format: 'date', example: '2026-12-31' },
                demand_matrix: { type: 'array', items: demandMatrixItemSchema },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Demand updated' },
        404: { description: 'Pool not found' },
      },
    },
  },

  '/api/pools/{pool_id}/shortages': {
    get: {
      tags: ['Human Resource Pools'],
      summary: 'Get shortage alerts for a pool',
      parameters: [poolPathParam],
      responses: {
        200: { description: 'List of shortage alerts' },
      },
    },
  },

  // ─── HR Pool Resources (physical assets within an HR pool) ───────────────────

  '/api/pools/{pool_id}/resources': {
    get: {
      tags: ['HR Pool Resources'],
      summary: 'List physical resources in an HR pool',
      description: [
        'Returns all physical resources (e.g. OR tables, ICU beds, equipment) that belong to this **human resource pool**.',
        '',
        'These are **not** renewable resource pool units — they are operational assets scoped to a specific clinical team.',
        'Each resource has a `weekly_template` (availability window) and `block_bookings` (recurring unavailability).',
        'The live `current_state` is computed at read time: active reservation → RESERVED; block_booking match → BLOCKED; else stored status.',
        '',
        '**Planning**: each resource\'s `weekly_template` is sent in the per-pool planning payload.',
        '**Triggers planning auto-run** on create / update / delete.',
      ].join('\n'),
      parameters: [poolPathParam],
      responses: {
        200: {
          description: 'List of HR pool physical resources',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: poolResourceResponseSchema },
                },
              },
            },
          },
        },
        404: { description: 'Pool not found' },
      },
    },
    post: {
      tags: ['HR Pool Resources'],
      summary: 'Add a physical resource to an HR pool',
      description: 'Creates a new physical resource (e.g. an OR table, ICU bed, or piece of equipment) and associates it with the HR pool. `resource_id` is auto-generated. **Triggers planning auto-run** within 10 s.',
      parameters: [poolPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', example: 'OR Table 1' },
                description: { type: 'string', example: 'Primary operating room table' },
                status: {
                  type: 'string',
                  enum: ['AVAILABLE', 'RESERVED', 'BLOCKED', 'MAINTENANCE'],
                  default: 'AVAILABLE',
                  description: 'Base status. At runtime, `current_state` may override this based on reservations or block_bookings.',
                },
                weekly_template: {
                  type: 'object',
                  description: 'Day-keyed schedule. Each day: array of `{start, end, role}` blocks; empty array = off.',
                  example: { monday: [{ start: '08:00', end: '20:00', role: 'OR Table' }], saturday: [], sunday: [] },
                },
                block_bookings: {
                  type: 'array',
                  items: blockBookingSchema,
                  description: 'Recurring weekly unavailability windows.',
                  example: [{ day: 'monday', start: '12:00', end: '13:00', reason: 'Deep cleaning' }],
                },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Resource created' },
        400: { description: 'Validation error' },
        404: { description: 'Pool not found' },
      },
    },
  },

  '/api/pools/{pool_id}/resources/{resource_id}': {
    get: {
      tags: ['HR Pool Resources'],
      summary: 'Get HR pool resource detail',
      description: 'Returns full resource detail including `weekly_template`, `block_bookings`, all `reservations`, and the live `current_state`.',
      parameters: [poolPathParam, resourcePathParam],
      responses: {
        200: {
          description: 'Resource detail',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: poolResourceResponseSchema,
                },
              },
            },
          },
        },
        404: { description: 'Resource not found' },
      },
    },
    put: {
      tags: ['HR Pool Resources'],
      summary: 'Update an HR pool resource',
      description: 'Any combination of fields may be patched. To manually override the live state, set `status` (e.g. `MAINTENANCE`). To add recurring unavailability, update `block_bookings`. For specific-date reservations, use the `/reservations` sub-resource. **Triggers planning auto-run** within 10 s.',
      parameters: [poolPathParam, resourcePathParam],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string', enum: ['AVAILABLE', 'RESERVED', 'BLOCKED', 'MAINTENANCE'] },
                weekly_template: { type: 'object' },
                block_bookings: { type: 'array', items: blockBookingSchema },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Resource updated' },
        400: { description: 'Validation error' },
        404: { description: 'Resource not found' },
      },
    },
    delete: {
      tags: ['HR Pool Resources'],
      summary: 'Delete an HR pool resource',
      description: 'Deletes the resource and all its reservations (cascade). **Triggers planning auto-run** within 10 s.',
      parameters: [poolPathParam, resourcePathParam],
      responses: {
        200: { description: 'Resource deleted' },
        404: { description: 'Resource not found' },
      },
    },
  },

  '/api/pools/{pool_id}/resources/{resource_id}/reservations': {
    get: {
      tags: ['HR Pool Resources'],
      summary: 'List reservations for an HR pool resource',
      description: 'Returns specific-date reservations. Filter by `date` (single day) or `status`. Ordered by date then start_time.',
      parameters: [
        poolPathParam,
        resourcePathParam,
        { name: 'date', in: 'query', required: false, description: 'Filter to a specific date (YYYY-MM-DD)', schema: { type: 'string', format: 'date' } },
        { name: 'status', in: 'query', required: false, description: 'Filter by reservation status', schema: { type: 'string', enum: ['ACTIVE', 'CANCELLED', 'COMPLETED'] } },
      ],
      responses: {
        200: {
          description: 'List of reservations',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: reservationSchema },
                },
              },
            },
          },
        },
        404: { description: 'Resource not found' },
      },
    },
    post: {
      tags: ['HR Pool Resources'],
      summary: 'Create a reservation for an HR pool resource',
      description: [
        'Books a specific date+time window for this physical resource. While the booking is ACTIVE and covers the current UTC time,',
        '`current_state` on the resource will return `"RESERVED"` regardless of the stored `status` field.',
        '',
        'Use `reference_id` to link the reservation to an external entity (e.g. a `surgery_id`).',
      ].join('\n'),
      parameters: [poolPathParam, resourcePathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['date', 'start_time', 'end_time'],
              properties: {
                date: { type: 'string', format: 'date', example: '2026-08-05' },
                start_time: { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '09:00' },
                end_time: { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '11:30' },
                reason: { type: 'string', example: 'Cardiothoracic surgery' },
                reference_id: { type: 'string', example: 'SURG-Rob-0014' },
                status: { type: 'string', enum: ['ACTIVE', 'CANCELLED', 'COMPLETED'], default: 'ACTIVE' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Reservation created' },
        400: { description: 'Validation error' },
        404: { description: 'Resource not found' },
      },
    },
  },

  '/api/pools/{pool_id}/resources/{resource_id}/reservations/{reservation_id}': {
    get: {
      tags: ['HR Pool Resources'],
      summary: 'Get reservation',
      parameters: [poolPathParam, resourcePathParam, reservationPathParam],
      responses: {
        200: {
          description: 'Reservation detail',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { success: { type: 'boolean' }, data: reservationSchema },
              },
            },
          },
        },
        404: { description: 'Reservation not found' },
      },
    },
    put: {
      tags: ['HR Pool Resources'],
      summary: 'Update reservation',
      description: 'Patch any field. Set `status: "CANCELLED"` to cancel without deleting the record.',
      parameters: [poolPathParam, resourcePathParam, reservationPathParam],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                date: { type: 'string', format: 'date' },
                start_time: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
                end_time: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
                reason: { type: 'string' },
                reference_id: { type: 'string' },
                status: { type: 'string', enum: ['ACTIVE', 'CANCELLED', 'COMPLETED'] },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Reservation updated' },
        400: { description: 'Validation error' },
        404: { description: 'Reservation not found' },
      },
    },
    delete: {
      tags: ['HR Pool Resources'],
      summary: 'Delete reservation',
      description: 'Permanently removes the reservation. To keep history, prefer `PUT` with `status: "CANCELLED"` instead.',
      parameters: [poolPathParam, resourcePathParam, reservationPathParam],
      responses: {
        200: { description: 'Reservation deleted' },
        404: { description: 'Reservation not found' },
      },
    },
  },
};
