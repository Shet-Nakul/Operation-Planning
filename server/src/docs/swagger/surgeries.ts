const stageRequirementSchema = {
  type: 'object',
  description: 'A single staffing or resource requirement within a surgery stage.',
  properties: {
    role: {
      type: 'string',
      example: 'Senior Surgeon',
      description: [
        'Must match a name in `GET /api/catalogs/roles` (case/spacing-insensitive slug match —',
        '`"senior_surgeon"` matches `"Senior Surgeon"`).',
        'Non-staff resources (OR room, ICU bed, equipment) are also modelled here using role-catalog entries',
        'such as `"Operation Room"` or `"ICU Bed"`.',
      ].join(' '),
    },
    assigned: {
      type: 'string',
      nullable: true,
      example: 'surgeon_1',
      description: [
        'Logical token assigned by the solver (e.g. `"surgeon_1"`, `"surgeon_2"`).',
        '**Not a `Staff.staff_id`** — the solver generates these tokens to represent role slots,',
        'not actual staff members. The server uses the token only to determine whether a role slot',
        'has been assigned (non-null) by the solver; it does not resolve the token back to a staff record.',
        'Null until the planning solver sets it.',
      ].join(' '),
    },
    count: {
      type: 'number',
      example: 1,
      description: 'Number of resources of this role required for the stage.',
    },
    duration: {
      type: 'array',
      items: { type: 'number' },
      minItems: 2,
      maxItems: 2,
      example: [30, 120],
      description: '[min, max] duration in minutes for this role within the stage.',
    },
    probability: {
      type: 'number',
      example: 0.08,
      description: 'Optional — probability this requirement applies (for conditional stage resources).',
    },
  },
  required: ['role', 'count', 'duration'],
};

const stagesSchema = {
  type: 'object',
  description: 'Surgery stages. Each stage is an array of role requirements. Empty array = no requirements for that stage.',
  properties: {
    pre_op:        { type: 'array', items: stageRequirementSchema },
    operative:     { type: 'array', items: stageRequirementSchema },
    post_op:       { type: 'array', items: stageRequirementSchema },
    sterilization: { type: 'array', items: stageRequirementSchema },
    recovery:      { type: 'array', items: stageRequirementSchema },
  },
  example: {
    pre_op: [],
    operative: [
      { role: 'Senior Surgeon', assigned: 'surgeon_1', count: 1, duration: [30, 120] },
      { role: 'Anesthesiologist', assigned: null, count: 1, duration: [30, 120] },
      { role: 'Operation Room', assigned: 'operation_room_1', count: 1, duration: [30, 120] },
    ],
    post_op: [
      { role: 'ICU Nurse', assigned: null, count: 2, duration: [60, 180] },
    ],
    sterilization: [],
    recovery: [],
  },
};

const timeWindowsSchema = {
  type: 'object',
  properties: {
    earliest_date: {
      type: 'string',
      example: '2026-08-12T00:00',
      description: 'Earliest the surgery may start (bare UTC datetime, no timezone suffix).',
    },
    latest_date: {
      type: 'string',
      example: '2026-08-14T23:59',
      description: 'Latest the surgery may start.',
    },
    planned_start: {
      type: 'string',
      nullable: true,
      example: null,
      description: [
        'Set by the planning solver when a concrete start time is assigned.',
        'Setting this on `PUT` with a non-null value automatically promotes `status` to `PLANNED`',
        '(unless `status` is also supplied in the same request, which always wins).',
      ].join(' '),
    },
    planned_by: {
      type: 'string',
      nullable: true,
      example: null,
      description: 'Identifier of whoever (or whatever) set the planned start.',
    },
  },
  required: ['earliest_date', 'latest_date'],
};

// surgery_id is server-generated (SURG-<first-3-letters-of-patient-firstname>-<4-digit-seq>), never client input.
const surgeryProperties = {
  organization_id: { type: 'number' },
  name: { type: 'string', example: 'Robert J. McAllister', description: 'Patient name. Used to derive `surgery_id` on create.' },
  type: { type: 'string', example: 'mandatory', description: 'Procedure type — matched against `GET /api/catalogs/operation_types`.' },
  infection_type: { type: 'number', example: 0 },
  department_id: { type: 'number', nullable: true, example: 1 },
  status: {
    type: 'string',
    enum: ['DRAFT', 'ESTIMATED', 'PLANNING', 'PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELLED'],
    description: [
      'Surgery lifecycle status.',
      '',
      '| Status | Set by | Condition |',
      '|--------|--------|-----------|',
      '| `DRAFT` | Server | Always forced on create, regardless of client input |',
      '| `ESTIMATED` | Client | Manual `PUT` — marks the surgery as ready to be planned |',
      '| `PLANNING` | Server | Automatically when the surgery is included in a planning solver payload |',
      '| `PLANNED` | Server | Automatically when the solver returns `completed` for that department; also set automatically on `PUT` when `time_windows.planned_start` is given (no explicit `status` in request) |',
      '| `IN_PROGRESS` | Server | Time-based background scheduler — when `planned_start` has been reached |',
      '| `DONE` | Server | Time-based background scheduler — when `planned_start + total stage duration` has elapsed |',
      '| `CANCELLED` | Client | Manual `PUT` at any stage |',
    ].join('\n'),
    example: 'DRAFT',
  },
  time_windows: timeWindowsSchema,
  stages: stagesSchema,
};

export const surgeriesDocs = {
  '/api/surgeries': {
    post: {
      tags: ['Surgeries'],
      summary: 'Create surgery',
      description: [
        'Creates a new surgery booking. `surgery_id` is auto-generated as `SURG-<3-letter name prefix>-<4-digit seq>`.',
        '`status` is always forced to `DRAFT` on create regardless of the value supplied.',
      ].join(' '),
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['organization_id', 'name', 'type', 'time_windows', 'stages'],
              properties: surgeryProperties,
            },
          },
        },
      },
      responses: {
        201: { description: 'Surgery created' },
        400: { description: 'Validation error (invalid role slug, missing required field, etc.)' },
      },
    },
    get: {
      tags: ['Surgeries'],
      summary: 'List surgeries',
      parameters: [
        { name: 'orgId', in: 'query', schema: { type: 'number' }, description: 'Filter by organization ID' },
      ],
      responses: { 200: { description: 'List of surgeries' } },
    },
  },

  '/api/surgeries/{id}': {
    get: {
      tags: ['Surgeries'],
      summary: 'Get surgery by ID',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: {
        200: { description: 'Surgery record' },
        404: { description: 'Surgery not found' },
      },
    },
    put: {
      tags: ['Surgeries'],
      summary: 'Update surgery',
      description: [
        'Partial update — only supplied fields are changed.',
        '',
        '**Auto-promotion rule:** If `time_windows.planned_start` is provided and non-null, and `status` is NOT in the',
        'request body, the server automatically sets `status = "PLANNED"`. An explicit `status` in the same request',
        'always takes precedence.',
      ].join('\n'),
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: surgeryProperties,
            },
          },
        },
      },
      responses: {
        200: { description: 'Surgery updated' },
        400: { description: 'Validation error' },
        404: { description: 'Surgery not found' },
      },
    },
    delete: {
      tags: ['Surgeries'],
      summary: 'Delete surgery',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: {
        200: { description: 'Surgery deleted' },
        404: { description: 'Surgery not found' },
      },
    },
  },
};
