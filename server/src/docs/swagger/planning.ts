import { OpenAPIV3 } from 'openapi-types';

export const planningDocs: OpenAPIV3.PathsObject = {
  '/api/planning': {
    post: {
      tags: ['Planning'],
      summary: 'Start Surgery Planning Process',
      description:
        'Triggers the surgery planning process for the authenticated user organization: builds a payload (horizon, resolution, operation hours, shift definitions, and pending surgeries) and streams it to the external planning solver over WebSocket (WEBSOCKET_URL_PLANNING).',
      security: [
        {
          bearerAuth: [],
        },
      ],
      responses: {
        200: {
          description: 'Surgery planning process started successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  processId: { type: 'string', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
                  message: { type: 'string', example: 'Surgery planning process started successfully' },
                },
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
        },
        409: {
          description: 'Surgery planning process already running',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Surgery planning process is still running' },
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
