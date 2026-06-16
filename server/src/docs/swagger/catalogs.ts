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
  '/api/catalogs/departments': {
    post: {
      tags: ['Catalogs'],
      summary: 'Create Department',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                organization_id: { type: 'number' },
                name: { type: 'string', example: 'Emergency' },
                description: { type: 'string', example: 'Emergency Department' },
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
      summary: 'Get Departments',
      parameters: [{ name: 'orgId', in: 'query', schema: { type: 'number' } }],
      responses: { 200: { description: 'Success' } },
    },
  },
  '/api/catalogs/departments/{id}': {
    put: {
      tags: ['Catalogs'],
      summary: 'Update Department',
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
      summary: 'Delete Department',
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
                alias: { type: 'string', example: 'D' },
                start_time: { type: 'string', example: '08:00' },
                end_time: { type: 'string', example: '16:00' },
                description: { type: 'string' },
              },
              required: ['organization_id', 'name', 'alias', 'start_time', 'end_time'],
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
                alias: { type: 'string' },
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
  '/api/catalogs/operation_types': {
    post: {
      tags: ['Catalogs'],
      summary: 'Create Operation Type',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                organization_id: { type: 'number' },
                category: { type: 'string', example: 'Neuro' },
                name: { type: 'string', example: 'Spinal Fusion' },
              },
              required: ['organization_id', 'category', 'name'],
            },
          },
        },
      },
      responses: { 201: { description: 'Created' } },
    },
    get: {
      tags: ['Catalogs'],
      summary: 'Get Operation Types',
      parameters: [{ name: 'orgId', in: 'query', schema: { type: 'number' } }],
      responses: { 200: { description: 'Success' } },
    },
  },
  '/api/catalogs/operation_types/{id}': {
    put: {
      tags: ['Catalogs'],
      summary: 'Update Operation Type',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
        },
      },
      responses: { 200: { description: 'Updated' } },
    },
    delete: {
      tags: ['Catalogs'],
      summary: 'Delete Operation Type',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: { 204: { description: 'Deleted' } },
    },
  },
  '/api/catalogs/phase_resource': {
    post: {
      tags: ['Catalogs'],
      summary: 'Create Phase Resource',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                organization_id: { type: 'number' },
                type: { type: 'string', example: 'Pre-operative' },
                name: { type: 'string', example: 'ICU Bed' },
                default_count: { type: 'number', example: 2 },
              },
              required: ['organization_id', 'type', 'name'],
            },
          },
        },
      },
      responses: { 201: { description: 'Created' } },
    },
    get: {
      tags: ['Catalogs'],
      summary: 'Get Phase Resources',
      parameters: [{ name: 'orgId', in: 'query', schema: { type: 'number' } }],
      responses: { 200: { description: 'Success' } },
    },
  },
  '/api/catalogs/phase_resource/{id}': {
    put: {
      tags: ['Catalogs'],
      summary: 'Update Phase Resource',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                name: { type: 'string' },
                default_count: { type: 'number' },
              },
            },
          },
        },
      },
      responses: { 200: { description: 'Updated' } },
    },
    delete: {
      tags: ['Catalogs'],
      summary: 'Delete Phase Resource',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: { 204: { description: 'Deleted' } },
    },
  },
  '/api/catalogs/constraint': {
    post: {
      tags: ['Catalogs'],
      summary: 'Create Constraint (Forbidden Pattern)',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                organization_id: { type: 'number' },
                scope: { type: 'string' },
                applies_to: { type: 'string' },
                forbidden_patterns: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      active: { type: 'boolean' },
                      hard: { type: 'boolean' },
                      weight: { type: 'number' },
                      value: { type: 'number' },
                      pattern: { type: 'array', items: { type: 'string' } },
                      reason: { type: 'string' }
                    },
                    required: ['name', 'active', 'hard', 'weight', 'reason']
                  }
                },
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
      tags: ['Catalogs'],
      summary: 'Get Constraints (Forbidden Patterns)',
      parameters: [{ name: 'orgId', in: 'query', schema: { type: 'number' } }],
      responses: { 200: { description: 'Success' } },
    },
  },
  '/api/catalogs/constraint/{id}': {
    put: {
      tags: ['Catalogs'],
      summary: 'Update Constraint',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                scope: { type: 'string' },
                applies_to: { type: 'string' },
                forbidden_patterns: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      active: { type: 'boolean' },
                      hard: { type: 'boolean' },
                      weight: { type: 'number' },
                      value: { type: 'number' },
                      pattern: { type: 'array', items: { type: 'string' } },
                      reason: { type: 'string' }
                    }
                  }
                },
                metadata: { type: 'object' },
              },
            },
          },
        },
      },
      responses: { 200: { description: 'Updated' } },
    },
    delete: {
      tags: ['Catalogs'],
      summary: 'Delete Constraint',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: { 204: { description: 'Deleted' } },
    },
  },
};
