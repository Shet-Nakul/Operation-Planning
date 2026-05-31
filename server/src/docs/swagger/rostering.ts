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
};