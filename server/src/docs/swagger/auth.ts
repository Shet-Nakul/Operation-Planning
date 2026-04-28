export const authDocs = {
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                password: { type: 'string' },
              },
              required: ['email', 'password'],
            },
          },
        },
      },
      responses: {
        200: { description: 'Success' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
                password: { type: 'string' },
                role: { type: 'string' },
                contract_id: { type: 'number' },
                employee_id: { type: 'string' },
                title: { type: 'string' },
                max_hours_per_week: { type: 'number' },
                status: { type: 'string' },
              },
              required: ['name', 'email', 'password', 'role', 'contract_id', 'employee_id', 'title', 'max_hours_per_week', 'status'],
            },
          },
        },
      },
      responses: {
        201: { description: 'Created' },
      },
    },
  },
};
