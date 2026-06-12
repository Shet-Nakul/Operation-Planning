import { OpenAPIV3 } from 'openapi-types';

export const rosteringDocs: OpenAPIV3.PathsObject = {
  '/api/rostering': {
    post: {
      tags: ['Rostering'],
      summary: 'Start Staff Rostering Process',
      description:
        'Triggers the staff rostering process for the authenticated user organization. If a rostering process is already running, the request may be queued and a conflict response returned.',
      security: [
        {
          bearerAuth: [],
        },
      ],
      responses: {
        200: {
          description: 'Rostering process started successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Rostering process initiated successfully',
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  message: {
                    type: 'string',
                    example: 'Unauthorized',
                  },
                },
              },
            },
          },
        },
        409: {
          description: 'Rostering process already running or request queued',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  message: {
                    type: 'string',
                    example: 'Rostering process already in progress',
                  },
                },
              },
            },
          },
        },
        500: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  error: {
                    type: 'string',
                    example: 'Unexpected error occurred',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/rosterings': {
    get: {
      tags: ['Rostering'],
      summary: 'Get latest rostering data',
      description: 'Retrieve the latest rostering data for an organization. Optionally filter by type to get only employee, pool, date, or stats data.',
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          name: 'orgId',
          in: 'query',
          required: true,
          description: 'Organization ID',
          schema: { type: 'integer' },
        },
        {
          name: 'type',
          in: 'query',
          required: false,
          description: 'Type of data to retrieve: employee, pool, date, or stats',
          schema: { type: 'string', enum: ['employee', 'pool', 'date', 'stats'] },
        },
      ],
      responses: {
        200: {
          description: 'Successfully retrieved rostering data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                example: {
                  employee_centric: {
                    emp_0: {
                      '2026-07-01': { pool: 'N1', shift: 'E' },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Bad request (missing or invalid orgId)',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Organization ID (orgId) is required' },
                },
              },
            },
          },
        },
        404: {
          description: 'Rostering data not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'No rostering data found' },
                },
              },
            },
          },
        },
        500: {
          description: 'Internal Server Error',
        },
      },
    },
  },
  '/api/rosterings/all': {
    get: {
      tags: ['Rostering'],
      summary: 'Get all rostering data',
      description: 'Retrieve all rostering data for an organization, sorted by creation date (newest first).',
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          name: 'orgId',
          in: 'query',
          required: true,
          description: 'Organization ID',
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Successfully retrieved all rostering data',
          content: {
            'application/json': {
              schema: { type: 'array', items: { type: 'object' } },
            },
          },
        },
        400: {
          description: 'Bad request (missing or invalid orgId)',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Organization ID (orgId) is required' },
                },
              },
            },
          },
        },
        500: {
          description: 'Internal Server Error',
        },
      },
    },
  },
  '/api/rosterings/employee': {
    get: {
      tags: ['Rostering'],
      summary: 'Get employee-centric rostering data',
      description: 'Retrieve employee-centric rostering data for a specific employee. Optionally filter by year and month.',
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          name: 'orgId',
          in: 'query',
          required: true,
          description: 'Organization ID',
          schema: { type: 'integer' },
        },
        {
          name: 'employeeId',
          in: 'query',
          required: true,
          description: 'Employee ID',
          schema: { type: 'string' },
        },
        {
          name: 'year',
          in: 'query',
          required: false,
          description: 'Year (optional, if omitted, latest data is used)',
          schema: { type: 'integer' },
        },
        {
          name: 'month',
          in: 'query',
          required: false,
          description: 'Month (1-12, optional, requires year)',
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Successfully retrieved employee-centric data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: {
                  type: 'object',
                  properties: {
                    pool: { type: 'string', nullable: true },
                    shift: { type: 'string' },
                  },
                },
                example: {
                  '2026-07-01': { pool: 'N1', shift: 'E' },
                  '2026-07-02': { pool: 'N1', shift: 'N' },
                },
              },
            },
          },
        },
        400: {
          description: 'Bad request (missing or invalid parameters)',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Organization ID (orgId) and employee ID are required' },
                },
              },
            },
          },
        },
        404: {
          description: 'Rostering data or employee not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'No rostering data found' },
                },
              },
            },
          },
        },
        500: {
          description: 'Internal Server Error',
        },
      },
    },
  },
  '/api/rosterings/pool': {
    get: {
      tags: ['Rostering'],
      summary: 'Get pool-centric rostering data',
      description: 'Retrieve pool-centric rostering data for a specific pool. Optionally filter by year and month.',
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          name: 'orgId',
          in: 'query',
          required: true,
          description: 'Organization ID',
          schema: { type: 'integer' },
        },
        {
          name: 'poolId',
          in: 'query',
          required: true,
          description: 'Pool ID',
          schema: { type: 'string' },
        },
        {
          name: 'year',
          in: 'query',
          required: false,
          description: 'Year (optional, if omitted, latest data is used)',
          schema: { type: 'integer' },
        },
        {
          name: 'month',
          in: 'query',
          required: false,
          description: 'Month (1-12, optional, requires year)',
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Successfully retrieved pool-centric data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: {
                  type: 'object',
                  additionalProperties: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
                example: {
                  '2026-07-01': { E: ['emp_0'], D: ['emp_1'] },
                },
              },
            },
          },
        },
        400: {
          description: 'Bad request (missing or invalid parameters)',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Organization ID (orgId) and pool ID are required' },
                },
              },
            },
          },
        },
        404: {
          description: 'Rostering data or pool not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'No rostering data found' },
                },
              },
            },
          },
        },
        500: {
          description: 'Internal Server Error',
        },
      },
    },
  },
  '/api/rosterings/date': {
    get: {
      tags: ['Rostering'],
      summary: 'Get date-centric rostering data',
      description: 'Retrieve date-centric rostering data for a specific date. Optionally filter by year and month.',
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          name: 'orgId',
          in: 'query',
          required: true,
          description: 'Organization ID',
          schema: { type: 'integer' },
        },
        {
          name: 'date',
          in: 'query',
          required: true,
          description: 'Date in YYYY-MM-DD format',
          schema: { type: 'string' },
        },
        {
          name: 'year',
          in: 'query',
          required: false,
          description: 'Year (optional, if omitted, latest data is used)',
          schema: { type: 'integer' },
        },
        {
          name: 'month',
          in: 'query',
          required: false,
          description: 'Month (1-12, optional, requires year)',
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Successfully retrieved date-centric data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: {
                  type: 'object',
                  additionalProperties: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
                example: {
                  N1: { E: ['emp_0'], D: ['emp_1'] },
                },
              },
            },
          },
        },
        400: {
          description: 'Bad request (missing or invalid parameters)',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Organization ID (orgId) and date are required' },
                },
              },
            },
          },
        },
        404: {
          description: 'Rostering data or date not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'No rostering data found' },
                },
              },
            },
          },
        },
        500: {
          description: 'Internal Server Error',
        },
      },
    },
  },
};