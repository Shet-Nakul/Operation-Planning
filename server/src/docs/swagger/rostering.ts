const rosteringRowSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    organization_id: { type: 'integer' },
    year: { type: 'integer', example: 2026 },
    month: { type: 'integer', example: 8 },
    employee_centric: {
      type: 'object',
      description: 'Keyed by staff_id → date → shift alias',
      example: {
        'STAFF-JD-0001': { '2026-08-01': 'M', '2026-08-02': 'N', '2026-08-03': 'O' },
      },
    },
    pool_centric: {
      type: 'object',
      description: 'Keyed by pool_id → date → shift alias → [staff_ids]',
      example: {
        'TRA-SUR-0001': { '2026-08-01': { M: ['STAFF-JD-0001', 'STAFF-AL-0002'] } },
      },
    },
    date_centric: {
      type: 'object',
      description: 'Keyed by date → pool_id → shift alias → [staff_ids]',
      example: {
        '2026-08-01': { 'TRA-SUR-0001': { M: ['STAFF-JD-0001'] } },
      },
    },
    stats: { type: 'object', description: 'Solver performance metrics from the last completed group' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

const commonParams = [
  {
    name: 'orgId',
    in: 'query',
    required: false,
    description: 'Organization ID. Required for ADMIN/SUPERADMIN callers; inferred from JWT for org-scoped tokens.',
    schema: { type: 'integer' },
  },
  {
    name: 'view',
    in: 'query',
    required: false,
    description: [
      'Selects which projection to return:',
      '- `latest` *(default)* — full rostering row (most recent, or the month specified by year+month)',
      '- `all` — array of all rostering rows for this org, newest first',
      '- `stats` — solver metrics from the selected row',
      '- `employee` — date→shift map for one employee (requires `employeeId`)',
      '- `pool` — date→shift→staff-list map for one pool (requires `poolId`)',
      '- `date` — pool→shift→staff-list map for one date (requires `date`)',
    ].join('\n'),
    schema: {
      type: 'string',
      enum: ['latest', 'all', 'employee', 'pool', 'date', 'stats'],
      default: 'latest',
    },
  },
  {
    name: 'year',
    in: 'query',
    required: false,
    description: 'Target year. Combined with `month` to pin a specific roster month; omit to use the most recent row.',
    schema: { type: 'integer', example: 2026 },
  },
  {
    name: 'month',
    in: 'query',
    required: false,
    description: 'Target month (1–12). Must be combined with `year`.',
    schema: { type: 'integer', minimum: 1, maximum: 12, example: 8 },
  },
  {
    name: 'employeeId',
    in: 'query',
    required: false,
    description: 'Staff ID — required when `view=employee`.',
    schema: { type: 'string', example: 'STAFF-JD-0001' },
  },
  {
    name: 'poolId',
    in: 'query',
    required: false,
    description: 'Pool ID — required when `view=pool`.',
    schema: { type: 'string', example: 'TRA-SUR-0001' },
  },
  {
    name: 'date',
    in: 'query',
    required: false,
    description: 'Date (YYYY-MM-DD) — required when `view=date`.',
    schema: { type: 'string', format: 'date', example: '2026-08-01' },
  },
];

export const rosteringDocs = {
  '/api/rostering': {
    post: {
      tags: ['Rostering'],
      summary: 'Trigger rostering run',
      description: [
        'Starts a staff rostering run for the given organization.',
        '',
        '**What happens:**',
        '1. Groups ResourcePools by employee overlap (union-find) — pools sharing any employee form one solver job.',
        '2. Sends each group serially to the external WebSocket solver (`WEBSOCKET_URL_ROSTER`).',
        '3. Accumulates each group\'s `completed` result in memory.',
        '4. After the last group completes, atomically replaces the target month\'s Rostering row (`deleteMany` + `create`).',
        '',
        'Returns immediately with a `processId`. Poll `GET /api/process-state` for progress.',
        'Rejected with 409 if a run is already in flight (server-wide lock).',
        '',
        '**Target period depends on how the run was triggered:**',
        '- Cron / manual (`POST /api/rostering`): `start_date` = first day of next calendar month, `horizon` = full month length.',
        '- Dirty auto-trigger: `start_date` = today (UTC), `horizon` = remaining days in current month including today.',
        '',
        '**Auto-triggers:** Rostering also runs automatically every 10 s when the dirty counter for the org is > 0',
        '(incremented by create/update/delete on Staff, Contract, or ResourcePool). Dirty-triggered runs always use',
        'the remaining-days-in-current-month window described above.',
      ].join('\n'),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['organizationId'],
              properties: {
                organizationId: { type: 'integer', description: 'Organization to roster for' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Run started',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  processId: { type: 'string', example: 'proc_abc123' },
                  message: { type: 'string', example: 'Process started successfully' },
                },
              },
            },
          },
        },
        409: {
          description: 'A run is already in progress',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { success: { type: 'boolean', example: false }, message: { type: 'string' } },
              },
            },
          },
        },
        500: { description: 'Internal server error' },
      },
    },
  },

  '/api/rosterings': {
    get: {
      tags: ['Rostering'],
      summary: 'Query rostering data',
      description: [
        'Single query endpoint for all rostering read access. Use the `view` parameter to select the projection:',
        '',
        '| `view` | Returns | Extra required param |',
        '|--------|---------|----------------------|',
        '| `latest` *(default)* | Full rostering row (most recent or pinned month) | — |',
        '| `all` | Array of all rows for this org, newest first | — |',
        '| `stats` | Solver metrics from the selected row | — |',
        '| `employee` | `{ "YYYY-MM-DD": "shiftAlias" }` for one employee | `employeeId` |',
        '| `pool` | `{ "YYYY-MM-DD": { "shiftAlias": ["staff_id", …] } }` for one pool | `poolId` |',
        '| `date` | `{ "pool_id": { "shiftAlias": ["staff_id", …] } }` for one date | `date` |',
        '',
        'Pin to a specific month with `year` + `month`; omit both to use the most recent row.',
      ].join('\n'),
      security: [{ bearerAuth: [] }],
      parameters: commonParams,
      responses: {
        200: {
          description: 'Rostering data matching the requested view',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    description: 'Shape varies by `view` — see description above',
                    oneOf: [
                      { ...rosteringRowSchema, title: 'view=latest — full row' },
                      { type: 'array', items: rosteringRowSchema, title: 'view=all — array of rows' },
                      {
                        type: 'object',
                        title: 'view=employee — date→shift map',
                        additionalProperties: { type: 'string' },
                        example: { '2026-08-01': 'M', '2026-08-02': 'N' },
                      },
                      {
                        type: 'object',
                        title: 'view=pool — date→shift→staff-list map',
                        additionalProperties: {
                          type: 'object',
                          additionalProperties: { type: 'array', items: { type: 'string' } },
                        },
                        example: { '2026-08-01': { M: ['STAFF-JD-0001'] } },
                      },
                      {
                        type: 'object',
                        title: 'view=date — pool→shift→staff-list map',
                        additionalProperties: {
                          type: 'object',
                          additionalProperties: { type: 'array', items: { type: 'string' } },
                        },
                        example: { 'TRA-SUR-0001': { M: ['STAFF-JD-0001'] } },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Missing required parameter for the requested view',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { error: { type: 'string', example: 'employeeId is required for view=employee' } },
              },
            },
          },
        },
        404: {
          description: 'No rostering data found, or the requested employee/pool/date not present in the row',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { error: { type: 'string', example: 'No rostering data found' } },
              },
            },
          },
        },
        500: { description: 'Internal server error' },
      },
    },
  },
};
