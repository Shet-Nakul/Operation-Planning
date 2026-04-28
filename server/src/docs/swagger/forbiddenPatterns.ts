export const forbiddenPatternsDocs = {
  '/api/catalogs/pattern': {
    post: {
      tags: ['ForbiddenPatterns'],
      summary: 'Create Forbidden Pattern',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                organization_id: { type: 'number' },
                scope: { type: 'string', example: 'GLOBAL' },
                applies_to: { type: 'string', example: 'ALL_CONTRACT_TYPES' },
                forbidden_patterns: { type: 'array', items: { type: 'object' } },
                metadata: { type: 'object' },
              },
              required: ['organization_id', 'forbidden_patterns'],
            },
          },
        },
      },
      responses: { 201: { description: 'Created' } },
    },
    get: {
      tags: ['ForbiddenPatterns'],
      summary: 'Get Forbidden Patterns',
      responses: { 200: { description: 'Success' } },
    },
  },
};
