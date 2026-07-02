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
                status: { type: 'string', example: 'ACTIVE' },
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
                status: { type: 'string' },
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
      description: 'Fails with 409 if the role is referenced by any staff member or surgery stage requirement - deactivate it instead by setting status to "INACTIVE".',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: {
        204: { description: 'Deleted' },
        409: { description: 'Role is in use and cannot be deleted' },
      },
    },
  },
  '/api/catalogs/resource_types': {
    post: {
      tags: ['Catalogs'],
      summary: 'Create Resource Type',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                organization_id: { type: 'number' },
                name: { type: 'string', example: 'BED' },
                status: { type: 'string', example: 'ACTIVE' },
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
      summary: 'Get Resource Types',
      parameters: [{ name: 'orgId', in: 'query', schema: { type: 'number' } }],
      responses: { 200: { description: 'Success' } },
    },
  },
  '/api/catalogs/resource_types/{id}': {
    put: {
      tags: ['Catalogs'],
      summary: 'Update Resource Type',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                status: { type: 'string' },
              },
            },
          },
        },
      },
      responses: { 200: { description: 'Updated' } },
    },
    delete: {
      tags: ['Catalogs'],
      summary: 'Delete Resource Type',
      description: 'Fails with 409 if the resource type is referenced by any renewable resource pool - deactivate it instead by setting status to "INACTIVE".',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: {
        204: { description: 'Deleted' },
        409: { description: 'Resource type is in use and cannot be deleted' },
      },
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
                status: { type: 'string', example: 'ACTIVE' },
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
                status: { type: 'string' },
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
                status: { type: 'string', example: 'ACTIVE' },
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
                status: { type: 'string' },
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
      description: 'Fails with 409 if the skill is referenced by any staff member - deactivate it instead by setting status to "INACTIVE".',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: {
        204: { description: 'Deleted' },
        409: { description: 'Skill is in use and cannot be deleted' },
      },
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
                status: { type: 'string', example: 'ACTIVE' },
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
                status: { type: 'string' },
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
      description: 'Fails with 409 if the department has any staff, resource pools, or surgeries assigned - deactivate it instead by setting status to "INACTIVE".',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: {
        200: { description: 'Deleted' },
        409: { description: 'Department is in use and cannot be deleted' },
      },
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
                status: { type: 'string', example: 'ACTIVE' },
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
                status: { type: 'string' },
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
      description: 'Fails with 409 if the shift is referenced by any staff weekly template or pool demand configuration - deactivate it instead by setting status to "INACTIVE".',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: {
        204: { description: 'Deleted' },
        409: { description: 'Shift is in use and cannot be deleted' },
      },
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
                status: { type: 'string', example: 'ACTIVE' },
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
                status: { type: 'string' },
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
                status: { type: 'string', example: 'ACTIVE' },
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
                status: { type: 'string' },
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
  '/api/catalogs/surgery_statuses': {
    post: {
      tags: ['Catalogs'],
      summary: 'Create Surgery Status',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                organization_id: { type: 'number' },
                name: { type: 'string', example: 'ESTIMATED' },
                to_plan: { type: 'boolean', example: true, description: 'If true, surgeries with this status are included in planning payloads (POST /api/planning).' },
                description: { type: 'string', example: 'Formally estimated, ready for planning.' },
              },
              required: ['organization_id', 'name', 'to_plan'],
            },
          },
        },
      },
      responses: { 201: { description: 'Created' } },
    },
    get: {
      tags: ['Catalogs'],
      summary: 'Get Surgery Statuses',
      description: 'Returns all surgery lifecycle statuses for an organization, ordered by id. The `to_plan` flag controls whether surgeries with that status are eligible for the planning payload.',
      parameters: [{ name: 'orgId', in: 'query', schema: { type: 'number' } }],
      responses: { 200: { description: 'Success' } },
    },
  },
  '/api/catalogs/surgery_statuses/{id}': {
    put: {
      tags: ['Catalogs'],
      summary: 'Update Surgery Status',
      description: 'Use this to toggle `to_plan` on any status, e.g. to allow DRAFT surgeries to be sent to the planner.',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                to_plan: { type: 'boolean' },
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
      summary: 'Delete Surgery Status',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: { 204: { description: 'Deleted' } },
    },
  },
};
