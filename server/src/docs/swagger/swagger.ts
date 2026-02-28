import { OpenAPIV3 } from 'openapi-types';
import { authDocs } from './auth';
import { organizationsDocs } from './organizations';
import { usersDocs } from './users';
import { rolesDocs } from './roles';
import { planningGlobalConfigDocs } from './planningGlobalConfig';
import { resourcesDocs } from './resources';
import { resourceDailyCapacityDocs } from './resourceDailyCapacity';
import { resourceAvailabilityWindowsDocs } from './resourceAvailabilityWindows';
import { phaseRequirementsDocs } from './phaseRequirements';
import { operationsDocs } from './operations';
import { operationTypesDocs } from './operationTypes';
import { infectionTypesDocs } from './infectionTypes';
import { surgeryPhaseRequirementsDocs } from './surgeryPhaseRequirements';

export const swaggerDocs: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Operation Planning API',
    version: '1.0.0',
    description: 'API documentation for Operation Planning',
  },
  servers: [
    { url: 'http://127.0.0.1:3333', description: 'Local server' }
  ],
  tags: [
    { name: 'Auth' },
    { name: 'Organizations' },
    { name: 'Users' },
    { name: 'Roles' },
    { name: 'PlanningGlobalConfig' },
    { name: 'Resources' },
    { name: 'ResourceDailyCapacity' },
    { name: 'ResourceAvailabilityWindows' },
    { name: 'PhaseRequirements' },
    { name: 'Operations' },
    { name: 'OperationTypes' },
    { name: 'InfectionTypes' },
    { name: 'SurgeryPhaseRequirements' }
  ],
  paths: {
    ...authDocs,
    ...organizationsDocs,
    ...usersDocs,
    ...rolesDocs,
    ...planningGlobalConfigDocs,
    ...resourcesDocs,
    ...resourceDailyCapacityDocs,
    ...resourceAvailabilityWindowsDocs,
    ...phaseRequirementsDocs,
    ...operationsDocs,
    ...operationTypesDocs,
    ...infectionTypesDocs,
    ...surgeryPhaseRequirementsDocs,
    '/api/auth/login': {
      post: {
        summary: 'Login',
        description: 'Authenticate user and return JWT token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Invalid credentials'
          }
        }
      }
    },
    '/api/surgery-phase-requirements': {
      post: {
        summary: 'Create Surgery Phase Requirement(s)',
        tags: ['SurgeryPhaseRequirements'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  organization_id: { type: 'integer' },
                  operation_id: { type: 'integer' },
                  phases: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/SurgeryPhaseRequirementInput' }
                  }
                },
                required: ['organization_id', 'operation_id', 'phases'],
                description: 'Send either "assigned" or "candidates", not both, for each phase. organization_id and operation_id are required at the root.'
              },
              example: {
                organization_id: 1,
                operation_id: 2,
                phases: [
                  {
                    phase_id: 3,
                    required_count: 1,
                    start_offset_min: 0,
                    end_offset_min: 60,
                    assigned: 7
                  },
                  {
                    phase_id: 4,
                    required_count: 2,
                    start_offset_min: 10,
                    end_offset_min: 90,
                    candidates: [8, 9]
                  }
                ]
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Created. Returns { organization_id, operation_id, phase_requirement_ids: [id, ...] }',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    organization_id: { type: 'integer' },
                    operation_id: { type: 'integer' },
                    phase_requirement_ids: {
                      type: 'array',
                      items: { type: 'integer' }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad Request. Possible error messages: ' +
              'Send either "assigned" or "candidates", not both, for each phase. ' +
              'You must provide either "assigned" (number) or "candidates" (array of numbers) for each phase. ' +
              'organization_id, operation_id, and non-empty phases array are required.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/surgery-phase-requirements/{id}': {
      put: {
        summary: 'Update Surgery Phase Requirement',
        tags: ['SurgeryPhaseRequirements'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SurgeryPhaseRequirement' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SurgeryPhaseRequirement' }
              }
            }
          }
        }
      }
    },
    '/api/operations': {
      post: {
        summary: 'Create Operation(s)',
        tags: ['Operations'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { $ref: '#/components/schemas/OperationInput' },
                  {
                    type: 'array',
                    items: { $ref: '#/components/schemas/OperationInput' }
                  }
                ]
              },
              example: [
                {
                  organization_id: 1,
                  operation_code: "OP001",
                  operation_type: 1,
                  infection_type: 2,
                  earliest_day: "2023-01-01",
                  latest_day: "2023-01-03",
                  status: "PENDING",
                  priority_score: 10.5,
                  duration_in_min: 120
                }
              ]
            }
          }
        },
        responses: {
          '201': {
            description: 'Created. Returns array of created operations with ids and backend-generated fields.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Operation' }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      Operation: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          organization_id: { type: 'integer' },
          operation_code: { type: 'string' },
          operation_type: { type: 'integer' },
          infection_type: { type: 'integer' },
          earliest_day: { type: 'string', format: 'date' },
          latest_day: { type: 'string', format: 'date' },
          status: { type: 'string' },
          priority_score: { type: 'number' },
          duration_in_min: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
          created_by: { type: 'integer' },
          updated_by: { type: 'integer' }
        },
        required: [
          'id',
          'organization_id',
          'operation_code',
          'operation_type',
          'infection_type',
          'earliest_day',
          'latest_day',
          'duration_in_min',
          'created_at',
          'updated_at',
          'created_by'
        ]
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          organization_id: { type: 'integer' },
          role_id: { type: 'integer' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          avatar_url: { type: 'string' },
          is_active: { type: 'boolean' },
          is_email_verified: { type: 'boolean' },
          last_login_at: { type: 'string', format: 'date-time' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        },
        required: ['role_id', 'first_name', 'email']
      },
      Organization: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        },
        required: ['name']
      },
      SurgeryPhaseRequirementInput: {
        type: 'object',
        properties: {
          organization_id: { type: 'integer', description: 'Required at root or in each item' },
          operation_id: { type: 'integer', description: 'Required at root or in each item' },
          phase_id: { type: 'integer' },
          required_count: { type: 'integer' },
          start_offset_min: { type: 'integer' },
          end_offset_min: { type: 'integer' },
          assigned: { type: 'integer', description: 'Resource ID for assigned resource (send either this OR candidates, not both)' },
          candidates: {
            type: 'array',
            items: { type: 'integer' },
            description: 'List of resource IDs for candidate resources (send either this OR assigned, not both)'
          }
        },
        required: [
          'phase_id',
          'required_count',
          'start_offset_min',
          'end_offset_min'
        ],
        description: 'Send either "assigned" or "candidates", not both. organization_id and operation_id can be sent at root or in each item.'
      },
      SurgeryPhaseRequirement: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          organization_id: { type: 'integer' },
          operation_id: { type: 'integer' },
          phase_id: { type: 'integer' },
          required_count: { type: 'integer' },
          start_offset_min: { type: 'integer' },
          end_offset_min: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          assigned: { type: 'integer', description: 'Resource ID for assigned resource (send either this OR candidates, not both)' },
          candidates: {
            type: 'array',
            items: { type: 'integer' },
            description: 'List of resource IDs for candidate resources (send either this OR assigned, not both)'
          }
        },
        required: [
          'organization_id',
          'operation_id',
          'phase_id',
          'required_count',
          'start_offset_min',
          'end_offset_min'
        ],
        oneOf: [
          { required: ['assigned'] },
          { required: ['candidates'] }
        ]
      },
      Role: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' }
        },
        required: ['name']
      },
      PlanningGlobalConfig: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          organization_id: { type: 'integer' },
          operating_start_time: { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '06:00' },
          operating_end_time: { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '18:00' },
          interval_minutes: { type: 'integer', minimum: 5, maximum: 30 },
          planning_horizon_days: { type: 'integer', minimum: 1 },
          is_active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
          created_by: { type: 'integer' },
          updated_by: { type: 'integer' }
        },
        required: [
          'organization_id',
          'operating_start_time',
          'operating_end_time',
          'interval_minutes',
          'planning_horizon_days',
          'created_by'
        ]
      },
      Resource: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          organization_id: { type: 'integer' },
          code: { type: 'string' },
          name: { type: 'string' },
          resource_type: { type: 'string', enum: ['INDIVIDUAL', 'POOL', 'NON_RENEWABLE'] },
          default_capacity: { type: 'integer' },
          is_active: { type: 'boolean' },
          created_by: { type: 'integer' },
          updated_by: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        },
        required: ['organization_id', 'code', 'name', 'resource_type', 'created_by']
      },
      ResourceDailyCapacity: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          organization_id: { type: 'integer' },
          resource_id: { type: 'integer' },
          day_number: { type: 'integer' },
          capacity: { type: 'integer' }
        },
        required: ['organization_id', 'resource_id', 'day_number', 'capacity']
      },
      ResourceAvailabilityWindow: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          daily_capacity_id: { type: 'integer' },
          start_time: { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '09:00' },
          end_time: { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '11:00' },
          is_extended: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' }
        },
        required: ['daily_capacity_id', 'start_time', 'end_time']
      },
      PhaseRequirement: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          organization_id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string' },
          phase_type: { type: 'string' },
          resource_type: { type: 'string' },
          is_active: { type: 'boolean' },
          created_by: { type: 'integer' },
          updated_by: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' }
        },
        required: ['organization_id', 'name', 'phase_type', 'resource_type', 'created_by']
      },
      OperationType: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          organization_id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'integer' },
          is_active: { type: 'boolean' },
          created_by: { type: 'integer' },
          updated_by: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' }
        },
        required: ['name', 'created_by']
      },
      OperationInput: {
        type: 'object',
        properties: {
          organization_id: { type: 'integer' },
          operation_code: { type: 'string' },
          operation_type: { type: 'integer', description: 'ID of operation type' },
          infection_type: { type: 'integer', description: 'ID of infection type' },
          earliest_day: { type: 'string', format: 'date', description: 'Earliest day (YYYY-MM-DD or ISO date string)' },
          latest_day: { type: 'string', format: 'date', description: 'Latest day (YYYY-MM-DD or ISO date string)' },
          status: { type: 'string', default: 'DRAFT' },
          priority_score: { type: 'number', default: 0 },
          duration_in_min: { type: 'integer' }
        },
        required: [
          'organization_id',
          'operation_code',
          'operation_type',
          'infection_type',
          'earliest_day',
          'latest_day',
          'duration_in_min'
        ],
        description: 'Do not send id, created_at, updated_at, created_by, or updated_by. These are set by the backend.'
      },
    }
  },
  security: [{ BearerAuth: [] }]
};

export default swaggerDocs;
