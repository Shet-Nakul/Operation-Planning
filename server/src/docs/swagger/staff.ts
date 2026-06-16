export const staffDocs = {
  '/api/staff': {
    post: {
      tags: ['Staff'],
      summary: 'Create Staff Member',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                organization_id: { type: 'number' },
                personal_details: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    address: { type: 'string' },
                    phone: { type: 'string' },
                    email: { type: 'string' },
                    profile_picture: { type: 'string' },
                  },
                  required: ['name'],
                },
                professional_primary_details: {
                  type: 'object',
                  properties: {
                    department_id: { type: 'number' },
                    designation: { type: 'string' },
                    contract_id: { type: 'string' },
                    supervisor: { type: 'string' },
                  },
                },
                professional_secondary_details: {
                  type: 'object',
                  properties: {
                    skills: { type: 'array', items: { type: 'string' } },
                    certifications: { type: 'array', items: { type: 'string' } },
                    roles: { type: 'array', items: { type: 'string' } },
                    role_distribution: { type: 'object', additionalProperties: { type: 'number' } },
                    weekly_template: { type: 'object' },
                    pool_assignments: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
              required: ['organization_id', 'personal_details'],
            },
          },
        },
      },
      responses: { 201: { description: 'Created' } },
    },
    get: {
      tags: ['Staff'],
      summary: 'Get All Staff Members',
      parameters: [
        {
          name: 'orgId',
          in: 'query',
          required: false,
          schema: { type: 'number' },
          description: 'Filter by organization ID',
        },
      ],
      responses: { 200: { description: 'Success' } },
    },
  },
  '/api/staff/{id}': {
    get: {
      tags: ['Staff'],
      summary: 'Get Staff Member By ID',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: { 200: { description: 'Success' } },
    },
    put: {
      tags: ['Staff'],
      summary: 'Update Staff Member',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                personal_details: { type: 'object' },
                professional_primary_details: { type: 'object' },
                professional_secondary_details: { type: 'object' },
              },
            },
          },
        },
      },
      responses: { 200: { description: 'Updated' } },
    },
    delete: {
      tags: ['Staff'],
      summary: 'Delete Staff Member',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: { 204: { description: 'Deleted' } },
    },
  },
};
