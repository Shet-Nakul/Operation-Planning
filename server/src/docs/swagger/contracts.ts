export const contractsDocs = {
  '/api/contracts': {
    post: {
      tags: ['Contracts'],
      summary: 'Create Contract',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                organization_id: { type: 'number' },
                name: { type: 'string', example: 'Senior Surgeon Standard 40h' },
                type: { type: 'string', enum: ['STATIC', 'DYNAMIC'] },
                status: { type: 'string', example: 'Active' },
                staff_tags: { type: 'array', items: { type: 'string' }, example: ['tag_surgeon'] },
                configuration: { type: 'object' },
                global_settings: { type: 'object' },
                metadata: { type: 'object' },
              },
              required: ['organization_id', 'name', 'type'],
            },
          },
        },
      },
      responses: { 201: { description: 'Created' } },
    },
    get: {
      tags: ['Contracts'],
      summary: 'Get Contracts',
      responses: { 200: { description: 'Success' } },
    },
  },
  '/api/contracts/{id}': {
    get: {
      tags: ['Contracts'],
      summary: 'Get Contract By ID',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: { 200: { description: 'Success' } },
    },
  },
};
