import { OpenAPIV3 } from 'openapi-types';

export const activityLogsDocs: OpenAPIV3.PathsObject = {
  '/api/activity-logs': {
    get: {
      tags: ['ActivityLogs'],
      summary: 'Get Activity Logs',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } },
        { name: 'orgId', in: 'query', schema: { type: 'number' } },
        { name: 'userId', in: 'query', schema: { type: 'number' } },
      ],
      responses: {
        200: { description: 'Success' },
      },
    },
  },
};
