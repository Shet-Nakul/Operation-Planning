/** Shared pool_type field included in every renewable resource pool response */
const renewablePoolTypeField = {
  pool_type: {
    type: 'string',
    enum: ['renewable_resource_pool'],
    readOnly: true,
    description: 'Discriminator identifying this as a **renewable resource pool** — a pool of reusable physical assets (beds, equipment, rooms, devices). Distinct from `human_resource_pool` (`/api/pools`) which tracks staff teams.',
    example: 'renewable_resource_pool',
  },
};

const unitReservationSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', readOnly: true },
    reservation_id: { type: 'string', readOnly: true, example: '550e8400-e29b-41d4-a716-446655440000' },
    unit_id: { type: 'integer', readOnly: true },
    from_datetime: { type: 'string', example: '2026-08-05T09:00', description: 'ISO datetime string (UTC)' },
    to_datetime: { type: 'string', example: '2026-08-05T11:30', description: 'ISO datetime string (UTC)' },
    reason: { type: 'string', example: 'Patient admission' },
    reference_id: { type: 'string', example: 'SURG-Rob-0014', description: 'Optional link to a surgery or external entity' },
    status: { type: 'string', enum: ['ACTIVE', 'CANCELLED'], default: 'ACTIVE' },
    created_at: { type: 'string', format: 'date-time', readOnly: true },
    updated_at: { type: 'string', format: 'date-time', readOnly: true },
  },
  required: ['from_datetime', 'to_datetime'],
};

const blockBookingSchema = {
  oneOf: [
    {
      type: 'object',
      title: 'Date Range Block',
      description: 'Block the unit for a specific date-time range.',
      properties: {
        type: { type: 'string', enum: ['date_range'] },
        from: { type: 'string', example: '2026-08-05T00:00', description: 'ISO datetime (UTC)' },
        to: { type: 'string', example: '2026-08-07T23:59', description: 'ISO datetime (UTC)' },
        reason: { type: 'string', example: 'Deep cleaning' },
      },
      required: ['type', 'from', 'to'],
    },
    {
      type: 'object',
      title: 'Weekly Recurring Block',
      description: 'Block the unit for a recurring weekly time window (e.g. every Monday 08:00–10:00).',
      properties: {
        type: { type: 'string', enum: ['weekly'] },
        day: { type: 'string', enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], example: 'monday' },
        start: { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '08:00' },
        end: { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '10:00' },
        reason: { type: 'string', example: 'Scheduled maintenance' },
      },
      required: ['type', 'day', 'start', 'end'],
    },
  ],
};

const resourceUnitSchema = {
  type: 'object',
  properties: {
    unit_id: { type: 'string', example: 'ICU-01', readOnly: true },
    status: {
      type: 'string',
      enum: ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RESERVED', 'BLOCKED'],
      description: 'Stored base status.',
    },
    current_status: {
      type: 'string',
      enum: ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RESERVED', 'BLOCKED'],
      readOnly: true,
      description: [
        'Live status computed at read time:',
        '1. RESERVED — if any ACTIVE reservation covers now.',
        '2. BLOCKED — if a `block_bookings` entry matches now (date_range or weekly).',
        '3. AVAILABLE — if `status_till` is set and has passed.',
        '4. Stored `status` otherwise.',
      ].join('\n'),
    },
    status_till: {
      type: 'string',
      format: 'date-time',
      nullable: true,
      description: 'When the current status is expected to expire. After this datetime, `current_status` auto-reverts to AVAILABLE.',
      example: '2026-08-06T18:00:00.000Z',
    },
    block_bookings: {
      type: 'array',
      items: blockBookingSchema,
      description: 'Scheduled unavailability windows. Supports both date-range (one-off) and weekly (recurring) shapes.',
    },
    variant: { type: 'string', example: 'STANDARD' },
    attributes: { type: 'object', description: 'Free-form unit metadata (e.g. room number, model)' },
    assigned_to: { type: 'string', nullable: true, description: 'Current assignment reference (patient ID, surgery ID, etc.)' },
    assigned_at: { type: 'string', format: 'date-time', nullable: true },
    estimated_release: { type: 'string', format: 'date-time', nullable: true },
    last_released_at: { type: 'string', format: 'date-time', nullable: true },
    created_at: { type: 'string', format: 'date-time', readOnly: true },
    updated_at: { type: 'string', format: 'date-time', readOnly: true },
  },
};

const poolPathParam = { name: 'pool_id', in: 'path', required: true, schema: { type: 'string' }, example: 'ICU-BED-101' };
const unitPathParam = { name: 'unit_id', in: 'path', required: true, schema: { type: 'string' }, example: 'ICU-01' };
const reservationPathParam = { name: 'reservation_id', in: 'path', required: true, schema: { type: 'string' }, example: '550e8400-e29b-41d4-a716-446655440000' };

export const renewableResourcesDocs = {
  '/api/resources/pools': {
    get: {
      tags: ['Renewable Resource Pools'],
      summary: 'List renewable resource pools',
      description: [
        'Returns all **renewable resource pools** for the organisation.',
        '',
        'A renewable resource pool groups reusable physical assets of the same type — e.g. all ICU beds, all ventilators, all OR rooms.',
        'Each pool owns individual **ResourceUnit** rows tracked per-unit with status, block_bookings, and reservations.',
        '',
        'Every response item includes `pool_type: "renewable_resource_pool"` to unambiguously distinguish from',
        '`/api/pools` (human resource pools — clinical staff teams).',
        '',
        '**Note:** Not currently projected into scheduling or planning solver payloads.',
        'Mutating any pool or unit **triggers planning auto-run** within 10 s.',
      ].join('\n'),
      parameters: [
        { name: 'resource_type', in: 'query', schema: { type: 'string', enum: ['BED', 'EQUIPMENT', 'ROOM', 'DEVICE', 'VEHICLE'] }, description: 'Filter by physical asset type' },
        { name: 'department', in: 'query', schema: { type: 'string' }, description: 'Filter by department (string match — no FK)' },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['OPERATIONAL', 'MAINTENANCE', 'DECOMMISSIONED'] }, description: 'Filter by pool status' },
        { name: 'orgId', in: 'query', schema: { type: 'number' } },
      ],
      responses: {
        200: {
          description: 'List of renewable resource pools',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    ...renewablePoolTypeField,
                    pool_id: { type: 'string', example: 'ICU-BED-101' },
                    pool_name: { type: 'string', example: 'ICU Bed Pool' },
                    resource_type: { type: 'string', enum: ['BED', 'EQUIPMENT', 'ROOM', 'DEVICE', 'VEHICLE'] },
                    department: { type: 'string', description: 'Department string (no FK — not grouped into per-dept planning payloads)' },
                    location: { type: 'string' },
                    total_capacity: { type: 'number' },
                    unit_count: { type: 'number' },
                    in_use: { type: 'number' },
                    available: { type: 'number' },
                    in_maintenance: { type: 'number' },
                    utilization_rate: { type: 'number', format: 'float' },
                    status: { type: 'string', enum: ['OPERATIONAL', 'MAINTENANCE', 'DECOMMISSIONED'] },
                    resources: { type: 'array', items: { type: 'string' }, description: 'unit_ids in this pool' },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Renewable Resource Pools'],
      summary: 'Create a renewable resource pool',
      description: [
        'Creates a new **renewable resource pool** of physical assets. Auto-generates `total_capacity` ResourceUnit rows on creation.',
        '',
        'Use `unit_prefix` to control unit ID generation (e.g. prefix `ICU` → units `ICU-01`, `ICU-02`, …).',
        '**Triggers planning auto-run** within 10 s.',
      ].join('\n'),
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['organization_id', 'pool_name', 'resource_type', 'total_capacity'],
              properties: {
                organization_id: { type: 'number' },
                pool_name: { type: 'string', example: 'ICU Bed Pool' },
                resource_type: { type: 'string', enum: ['BED', 'EQUIPMENT', 'ROOM', 'DEVICE', 'VEHICLE'] },
                department: { type: 'string', description: 'Department name string — no FK to departments table' },
                location: { type: 'string' },
                total_capacity: { type: 'number', description: 'Number of individual units to auto-generate' },
                unit_prefix: { type: 'string', example: 'ICU', description: 'Prefix for auto-generated unit IDs' },
                default_variant: { type: 'string', default: 'STANDARD' },
                default_attributes: { type: 'object' },
                weekly_template: {
                  type: 'object',
                  description: 'Pool-level open hours per day. Each day: `{hours: [["HH:mm","HH:mm"]]}`. Empty hours = closed.',
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
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Renewable resource pool created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ...renewablePoolTypeField,
                  pool_id: { type: 'string' },
                  pool_name: { type: 'string' },
                  total_capacity: { type: 'number' },
                  units_preview: { type: 'array', description: 'First 2 auto-generated units' },
                },
              },
            },
          },
        },
        400: { description: 'Validation error' },
      },
    },
  },

  '/api/resources/pools/{pool_id}': {
    get: {
      tags: ['Renewable Resource Pools'],
      summary: 'Get renewable resource pool detail',
      description: 'Returns full pool detail including all units with their live `current_status`, `block_bookings`, and active reservations. `pool_type: "renewable_resource_pool"` is always present.',
      parameters: [poolPathParam],
      responses: {
        200: {
          description: 'Detailed renewable resource pool',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ...renewablePoolTypeField,
                  pool_id: { type: 'string' },
                  pool_name: { type: 'string' },
                  resource_type: { type: 'string' },
                  total_capacity: { type: 'number' },
                  available: { type: 'number' },
                  in_use: { type: 'number' },
                  in_maintenance: { type: 'number' },
                  utilization_rate: { type: 'number' },
                  units: { type: 'array', items: resourceUnitSchema, description: 'All units with live current_status' },
                },
              },
            },
          },
        },
        404: { description: 'Pool not found' },
      },
    },
  },

  '/api/resources/pools/{pool_id}/capacity': {
    put: {
      tags: ['Renewable Resource Pools'],
      summary: 'Update total pool capacity',
      description: [
        'Increases or decreases the number of units in the pool.',
        '- **Increase**: auto-generates new AVAILABLE units with the pool\'s prefix/variant.',
        '- **Decrease**: removes the highest-suffix AVAILABLE units. Rejects if not enough AVAILABLE units exist.',
        '',
        '**Triggers planning auto-run** within 10 s.',
      ].join('\n'),
      parameters: [poolPathParam],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['total_capacity'],
              properties: {
                total_capacity: { type: 'number', description: 'New target total (must be ≥ 0; decrease only removes AVAILABLE units)' },
                reason: { type: 'string', example: 'Seasonal demand increase' },
                effective_from: { type: 'string', example: '2026-08-01' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Capacity updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ...renewablePoolTypeField,
                  pool_id: { type: 'string' },
                  total_capacity: { type: 'number' },
                  previous_capacity: { type: 'number' },
                  units_added: { type: 'array', items: { type: 'string' } },
                  units_removed: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        409: { description: 'Not enough AVAILABLE units to reduce to requested capacity' },
      },
    },
  },

  '/api/resources/pools/{pool_id}/health': {
    get: {
      tags: ['Renewable Resource Pools'],
      summary: 'Get renewable resource pool health metrics',
      parameters: [poolPathParam],
      responses: {
        200: {
          description: 'Health metrics',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ...renewablePoolTypeField,
                  pool_id: { type: 'string' },
                  current_utilization: { type: 'number' },
                  maintenance: { type: 'object' },
                  turnover: { type: 'object' },
                  projections: { type: 'object' },
                  alerts: { type: 'array' },
                },
              },
            },
          },
        },
      },
    },
  },

  '/api/resources/pools/{pool_id}/units': {
    post: {
      tags: ['Renewable Resource Pools'],
      summary: 'Add new units to an existing renewable resource pool',
      description: 'Manually adds specific units (providing their own unit_ids) to an existing pool. For auto-generated capacity expansion, use `PUT /capacity` instead. **Triggers planning auto-run** within 10 s.',
      parameters: [poolPathParam],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['units'],
              properties: {
                units: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['unit_id'],
                    properties: {
                      unit_id: { type: 'string', example: 'ICU-11' },
                      variant: { type: 'string', default: 'STANDARD' },
                      attributes: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Units added',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ...renewablePoolTypeField,
                  pool_id: { type: 'string' },
                  total_capacity: { type: 'number' },
                  previous_capacity: { type: 'number' },
                  units_added: { type: 'array' },
                },
              },
            },
          },
        },
      },
    },
  },

  '/api/resources/pools/{pool_id}/weekly_template': {
    put: {
      tags: ['Renewable Resource Pools'],
      summary: 'Set pool-level operating hours (weekly template)',
      description: 'Each day is an object with `hours`: a list of [start, end] pairs (24h HH:mm). Pass `{"hours":[]}` for a day to mark it as closed. **Triggers planning auto-run** within 10 s.',
      parameters: [poolPathParam],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['weekly_template'],
              properties: {
                weekly_template: {
                  type: 'object',
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
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Weekly template updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ...renewablePoolTypeField,
                  pool_id: { type: 'string' },
                  pool_name: { type: 'string' },
                  weekly_template: { type: 'object' },
                },
              },
            },
          },
        },
        404: { description: 'Pool not found' },
      },
    },
  },

  // ─── Pool-level reservations (legacy JSON blob) ───────────────────────────────

  '/api/resources/pools/{pool_id}/reservations': {
    get: {
      tags: ['Renewable Resource Pools'],
      summary: 'List pool-level reservations (legacy)',
      description: 'Returns the pool-level JSON blob reservations. For per-unit reservations with full CRUD, use `/api/resources/units/{unit_id}/reservations` instead.',
      parameters: [poolPathParam],
      responses: { 200: { description: 'List of reservations' }, 404: { description: 'Pool not found' } },
    },
    post: {
      tags: ['Renewable Resource Pools'],
      summary: 'Add a pool-level reservation (legacy)',
      description: 'Appends a reservation to the pool-level JSON blob. For structured per-unit reservations, use `/api/resources/units/{unit_id}/reservations` instead. **Triggers planning auto-run** within 10 s.',
      parameters: [poolPathParam],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['resource_id', 'start', 'end', 'type'],
              properties: {
                resource_id: { type: 'string', example: 'ICU-01', description: 'unit_id of the resource being reserved' },
                start: { type: 'string', example: '2026-07-02T10:00:00' },
                end: { type: 'string', example: '2026-07-05T12:00:00' },
                type: { type: 'string', example: 'patient', description: '"patient" | "maintenance" | custom string' },
              },
            },
          },
        },
      },
      responses: { 201: { description: 'Reservation created' }, 400: { description: 'Validation error' }, 404: { description: 'Pool not found' } },
    },
  },

  '/api/resources/pools/{pool_id}/reservations/{reservation_id}': {
    delete: {
      tags: ['Renewable Resource Pools'],
      summary: 'Delete a pool-level reservation (legacy)',
      description: '**Triggers planning auto-run** within 10 s.',
      parameters: [
        poolPathParam,
        { name: 'reservation_id', in: 'path', required: true, schema: { type: 'string' }, description: 'The `id` returned when the reservation was created' },
      ],
      responses: { 200: { description: 'Reservation deleted' }, 404: { description: 'Pool or reservation not found' } },
    },
  },

  // ─── Individual Resource Units ────────────────────────────────────────────────

  '/api/resources/units/{unit_id}': {
    patch: {
      tags: ['Resource Units'],
      summary: 'Update an individual resource unit',
      description: [
        'Updates the state of a single physical unit within a **renewable resource pool**.',
        '',
        '- Set `status` to manually place the unit in a base state.',
        '- Set `status_till` (ISO datetime) to mark the status as temporary — the unit auto-reverts to AVAILABLE after this datetime.',
        '- Update `block_bookings` to schedule recurring (`weekly`) or one-off (`date_range`) unavailability.',
        '',
        '`current_status` is always computed at read time — it is never stored.',
        '**Triggers planning auto-run** within 10 s.',
      ].join('\n'),
      parameters: [unitPathParam],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RESERVED', 'BLOCKED'] },
                status_till: {
                  type: 'string',
                  nullable: true,
                  example: '2026-08-06T18:00',
                  description: 'ISO datetime (UTC). After this time, current_status reverts to AVAILABLE. Pass null to clear.',
                },
                block_bookings: {
                  type: 'array',
                  items: blockBookingSchema,
                  description: 'Full replacement of block bookings. Each entry is either a date_range or weekly shape.',
                },
                variant: { type: 'string' },
                attributes: { type: 'object' },
                reason: { type: 'string', description: 'Logged in response metadata' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Unit updated',
          content: {
            'application/json': {
              schema: resourceUnitSchema,
            },
          },
        },
        400: { description: 'Validation error' },
        404: { description: 'Unit not found' },
      },
    },
  },

  // ─── Per-unit reservations ────────────────────────────────────────────────────

  '/api/resources/units/{unit_id}/reservations': {
    get: {
      tags: ['Resource Units'],
      summary: 'List reservations for a resource unit',
      description: 'Returns all reservations for this unit. Filter by `status`. Ordered by `from_datetime` ascending.',
      parameters: [
        unitPathParam,
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'CANCELLED'] }, description: 'Filter by reservation status' },
      ],
      responses: {
        200: {
          description: 'List of unit reservations',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: unitReservationSchema },
                },
              },
            },
          },
        },
        404: { description: 'Unit not found' },
      },
    },
    post: {
      tags: ['Resource Units'],
      summary: 'Create a reservation for a resource unit',
      description: [
        'Books a specific datetime range for this unit. While ACTIVE and covering the current time, `current_status` returns `RESERVED`.',
        'Use `reference_id` to link to a surgery_id or other external entity.',
        '**Triggers planning auto-run** within 10 s.',
      ].join('\n'),
      parameters: [unitPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['from_datetime', 'to_datetime'],
              properties: {
                from_datetime: { type: 'string', example: '2026-08-05T09:00', description: 'ISO datetime (UTC)' },
                to_datetime: { type: 'string', example: '2026-08-05T11:30', description: 'ISO datetime (UTC)' },
                reason: { type: 'string', example: 'Patient admission' },
                reference_id: { type: 'string', example: 'SURG-Rob-0014' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Reservation created',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { success: { type: 'boolean' }, data: unitReservationSchema } },
            },
          },
        },
        400: { description: 'Validation error' },
        404: { description: 'Unit not found' },
      },
    },
  },

  '/api/resources/units/{unit_id}/reservations/{reservation_id}': {
    get: {
      tags: ['Resource Units'],
      summary: 'Get a unit reservation by ID',
      parameters: [unitPathParam, reservationPathParam],
      responses: {
        200: {
          description: 'Reservation detail',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { success: { type: 'boolean' }, data: unitReservationSchema } },
            },
          },
        },
        404: { description: 'Reservation not found' },
      },
    },
    put: {
      tags: ['Resource Units'],
      summary: 'Update a unit reservation',
      description: 'Patch any field. Set `status: "CANCELLED"` to cancel without deleting. **Triggers planning auto-run** within 10 s.',
      parameters: [unitPathParam, reservationPathParam],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                from_datetime: { type: 'string' },
                to_datetime: { type: 'string' },
                reason: { type: 'string' },
                reference_id: { type: 'string' },
                status: { type: 'string', enum: ['ACTIVE', 'CANCELLED'] },
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
      tags: ['Resource Units'],
      summary: 'Delete a unit reservation',
      description: 'Permanently removes the reservation. Prefer `PUT` with `status: "CANCELLED"` to keep history. **Triggers planning auto-run** within 10 s.',
      parameters: [unitPathParam, reservationPathParam],
      responses: {
        200: { description: 'Reservation deleted' },
        404: { description: 'Reservation not found' },
      },
    },
  },
};
