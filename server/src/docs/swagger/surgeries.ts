const stageRequirementSchema = {
  type: 'object',
  properties: {
    role: { type: 'string', example: 'anesthesiologist', description: 'Must match a name in /api/catalogs/roles (case/spacing-insensitive, e.g. "or_nurse" matches "OR Nurse")' },
    assigned: { type: 'string', nullable: true, example: null },
    count: { type: 'number', example: 1 },
    duration: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2, example: [30, 120] },
    probability: { type: 'number', example: 0.08 },
  },
  required: ['role', 'count', 'duration'],
};

const stagesSchema = {
  type: 'object',
  properties: {
    pre_op: { type: 'array', items: stageRequirementSchema },
    operative: { type: 'array', items: stageRequirementSchema },
    post_op: { type: 'array', items: stageRequirementSchema },
    sterilization: { type: 'array', items: stageRequirementSchema },
    recovery: { type: 'array', items: stageRequirementSchema },
  },
};

const timeWindowsSchema = {
  type: 'object',
  properties: {
    earliest_date: { type: 'string', example: '2026-02-12T00:00' },
    latest_date: { type: 'string', example: '2026-02-14T23:59' },
    planned_start: { type: 'string', nullable: true, example: null },
    planned_by: { type: 'string', nullable: true, example: null },
  },
  required: ['earliest_date', 'latest_date'],
};

// surgery_id is server-generated (SURG-<3-letter first-name prefix>-<4-digit sequence>), not client input.
const surgeryProperties = {
  organization_id: { type: 'number' },
  name: { type: 'string', example: 'Robert J. McAllister' },
  type: { type: 'string', example: 'mandatory' },
  infection_type: { type: 'number', example: 0 },
  department_id: { type: 'number', nullable: true, example: 1 },
  time_windows: timeWindowsSchema,
  stages: stagesSchema,
};

export const surgeriesDocs = {
  '/api/surgeries': {
    post: {
      tags: ['Surgeries'],
      summary: 'Create Surgery',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: surgeryProperties,
              required: ['organization_id', 'name', 'type', 'time_windows', 'stages'],
            },
          },
        },
      },
      responses: { 201: { description: 'Created' } },
    },
    get: {
      tags: ['Surgeries'],
      summary: 'Get Surgeries',
      parameters: [{ name: 'orgId', in: 'query', schema: { type: 'number' } }],
      responses: { 200: { description: 'Success' } },
    },
  },
  '/api/surgeries/{id}': {
    get: {
      tags: ['Surgeries'],
      summary: 'Get Surgery By ID',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: { 200: { description: 'Success' } },
    },
    put: {
      tags: ['Surgeries'],
      summary: 'Update Surgery',
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
      responses: { 200: { description: 'Updated' } },
    },
    delete: {
      tags: ['Surgeries'],
      summary: 'Delete Surgery',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: { 200: { description: 'Deleted' } },
    },
  },
};
