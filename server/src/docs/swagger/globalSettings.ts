export const globalSettingsDocs = {
  '/api/catalogs/global_settings': {
    post: {
      tags: ['GlobalSettings'],
      summary: 'Upsert Global Settings',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                organization_id: { type: 'number' },
                operation_hours_start: { type: 'string', example: '08:00' },
                operation_hours_end: { type: 'string', example: '18:00' },
                surgery_planning_horizon: { type: 'number', example: 3 },
                roster_planning_horizon: { type: 'number', example: 28 },
                surgery_planning_resolution: { type: 'number', example: 15 },
                schedule_date: { type: 'number', example: 1, minimum: 1, maximum: 31, description: 'Day of the month (1-31) on which the rostering/planning schedule should run' },
              },
              required: ['organization_id'],
            },
          },
        },
      },
      responses: { 200: { description: 'Success' } },
    },
  },
  '/api/catalogs/global_settings/{orgId}': {
    get: {
      tags: ['GlobalSettings'],
      summary: 'Get Global Settings',
      parameters: [{ name: 'orgId', in: 'path', required: true, schema: { type: 'number' } }],
      responses: { 200: { description: 'Success' } },
    },
    delete: {
      tags: ['GlobalSettings'],
      summary: 'Delete Global Settings',
      parameters: [{ name: 'orgId', in: 'path', required: true, schema: { type: 'number' } }],
      responses: { 204: { description: 'Deleted' } },
    },
  },
};
