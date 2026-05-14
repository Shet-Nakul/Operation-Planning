export const catalogsDocs = {
  '/api/catalogs/roles': {
    post: {
      tags: ['Catalogs'],
      summary: 'Create Staff Tag (Role)',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                organization_id: { type: 'number' },
                name: { type: 'string', example: 'Surgeon' },
                color: { type: 'string', example: '#4F46E5' },
              },
              required: ['organization_id', 'name'],
            },
          },
        },
      },
      responses: { 201: { description: 'Created' } },
    },
    get: {
      tags: ['Catalogs'],
      summary: 'Get Staff Tags',
      parameters: [{ name: 'orgId', in: 'query', schema: { type: 'number' } }],
      responses: { 200: { description: 'Success' } },
    },
  },
  '/api/catalogs/roles/{id}': {
    put: {
      tags: ['Catalogs'],
      summary: 'Update Staff Tag (Role)',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                color: { type: 'string' },
              },
            },
          },
        },
      },
      responses: { 200: { description: 'Updated' } },
    },
    delete: {
      tags: ['Catalogs'],
      summary: 'Delete Staff Tag (Role)',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: { 204: { description: 'Deleted' } },
    },
  },
  '/api/catalogs/specializations': {
    post: {
      tags: ['Catalogs'],
      summary: 'Create Specialization',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                organization_id: { type: 'number' },
                name: { type: 'string', example: 'Oncology' },
                description: { type: 'string', example: 'Cancer-related surgical procedures' },
              },
              required: ['organization_id', 'name'],
            },
          },
        },
      },
      responses: { 201: { description: 'Created' } },
    },
    get: {
      tags: ['Catalogs'],
      summary: 'Get Specializations',
      responses: { 200: { description: 'Success' } },
    },
  },
  '/api/catalogs/specializations/{id}': {
    put: {
      tags: ['Catalogs'],
      summary: 'Update Specialization',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
              },
            },
          },
        },
      },
      responses: { 200: { description: 'Updated' } },
    },
    delete: {
      tags: ['Catalogs'],
      summary: 'Delete Specialization',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: { 204: { description: 'Deleted' } },
    },
  },
  '/api/catalogs/skills': {
    post: {
      tags: ['Catalogs'],
      summary: 'Create Skill',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                organization_id: { type: 'number' },
                name: { type: 'string', example: 'Robotic Surgery' },
                description: { type: 'string', example: 'Certification for Da Vinci surgical systems' },
              },
              required: ['organization_id', 'name'],
            },
          },
        },
      },
      responses: { 201: { description: 'Created' } },
    },
    get: {
      tags: ['Catalogs'],
      summary: 'Get Skills',
      responses: { 200: { description: 'Success' } },
    },
  },
  '/api/catalogs/skills/{id}': {
    put: {
      tags: ['Catalogs'],
      summary: 'Update Skill',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
              },
            },
          },
        },
      },
      responses: { 200: { description: 'Updated' } },
    },
    delete: {
      tags: ['Catalogs'],
      summary: 'Delete Skill',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: { 204: { description: 'Deleted' } },
    },
  },
  '/api/catalogs/shift': {
    post: {
      tags: ['Catalogs'],
      summary: 'Create Shift',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                organization_id: { type: 'number' },
                name: { type: 'string', example: 'Day' },
                start_time: { type: 'string', example: '08:00' },
                end_time: { type: 'string', example: '16:00' },
                description: { type: 'string' },
              },
              required: ['organization_id', 'name', 'start_time', 'end_time'],
            },
          },
        },
      },
      responses: { 201: { description: 'Created' } },
    },
    get: {
      tags: ['Catalogs'],
      summary: 'Get Shifts',
      responses: { 200: { description: 'Success' } },
    },
  },
  '/api/catalogs/shift/{id}': {
    put: {
      tags: ['Catalogs'],
      summary: 'Update Shift',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                start_time: { type: 'string' },
                end_time: { type: 'string' },
                description: { type: 'string' },
              },
            },
          },
        },
      },
      responses: { 200: { description: 'Updated' } },
    },
    delete: {
      tags: ['Catalogs'],
      summary: 'Delete Shift',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: { 204: { description: 'Deleted' } },
    },
  },
};
