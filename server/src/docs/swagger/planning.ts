import { OpenAPIV3 } from 'openapi-types';

export const planningDocs: OpenAPIV3.PathsObject = {
  '/api/planning': {
    post: {
      tags: ['Planning'],
      summary: 'Start Surgery Planning Process',
      description: `Triggers the two-phase surgery planning pipeline for the authenticated user's organization.

**Phase 1 — Feasibility check** (WEBSOCKET\_URL\_PLANNING\_FEASIBILITY): Each department payload is sent to the feasibility solver. Departments with zero eligible surgeries are skipped. The response identifies feasible and infeasible surgeries. Infeasible surgeries are dropped (logged with \`top_feasible_starts\` hints); feasible surgeries are promoted \`ESTIMATED → PLANNING\`.

**Phase 2 — Planning** (WEBSOCKET\_URL\_PLANNING\_SINGLE or WEBSOCKET\_URL\_PLANNING): Each feasibility-filtered department payload is sent to the planning solver — \`SINGLE\` endpoint when exactly 1 surgery remains, multi endpoint when 2 or more. The solver returns \`{ status: "completed", result: [{id, resources_assigned, planned_start}] }\`. Each surgery result is upserted to \`surgery_plan_results\` and \`planned_start\` is written back to \`Surgery.time_windows.planned_start\`; status advances to \`PLANNED\`.

A fresh WebSocket connection is opened for each call (\`sendSinglePayload\`). No shared persistent connection. 60 s timeout per call. Errors on a single department are logged and skipped — the run continues for remaining departments.

Only one planning run can be in-flight at a time (\`isPlanningRunning\` global lock). This lock is set synchronously before the first \`await\` to prevent two near-simultaneous callers from both starting.`,
      security: [{ bearerAuth: [] }],
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
        401: { description: 'Unauthorized' },
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
        500: { description: 'Internal Server Error' },
      },
    },
  },

  '/api/planning-state': {
    get: {
      tags: ['Planning'],
      summary: 'Get Planning Process State',
      description: 'Returns whether a surgery planning run is currently in-flight. In-memory only — resets on server restart.',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Current planning process state',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  running: { type: 'boolean', example: false },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
      },
    },
  },

  '/api/surgery-plans': {
    get: {
      tags: ['Planning'],
      summary: 'List Surgery Plan Results',
      description: 'Returns all solver results for surgeries in the given organization, newest first. Each row holds the full solver output for one surgery (as returned in the planning `result[]` list).',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'orgId',
          in: 'query',
          required: false,
          schema: { type: 'integer' },
          description: 'Organization ID. Defaults to the authenticated user\'s organization if omitted.',
        },
      ],
      responses: {
        200: {
          description: 'Surgery plan results',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', example: 1 },
                        surgery_id: { type: 'string', example: 'SURG-JOH-0001' },
                        organization_id: { type: 'integer', example: 1 },
                        department: { type: 'string', example: 'Cardiothoracic Surgery' },
                        result: {
                          type: 'object',
                          description: 'Full solver output for this surgery. Shape: { id, resources_assigned, planned_start, … }',
                          example: { id: 'SURG-JOH-0001', resources_assigned: { surgeon: 'surgeon_1' }, planned_start: '2026-07-22T09:00' },
                        },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: 'orgId is required (when not authenticated with an org context)' },
        401: { description: 'Unauthorized' },
        500: { description: 'Internal Server Error' },
      },
    },
  },

  '/api/surgery-plans/{surgery_id}': {
    get: {
      tags: ['Planning'],
      summary: 'Get Surgery Plan Result by Surgery ID',
      description: 'Returns the latest solver result for a single surgery. Returns 404 if no planning run has produced a result for this surgery yet.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'surgery_id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'The surgery_id string (e.g. SURG-JOH-0001), not the numeric database id.',
          example: 'SURG-JOH-0001',
        },
      ],
      responses: {
        200: {
          description: 'Surgery plan result',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer', example: 1 },
                      surgery_id: { type: 'string', example: 'SURG-JOH-0001' },
                      organization_id: { type: 'integer', example: 1 },
                      department: { type: 'string', example: 'Cardiothoracic Surgery' },
                      result: {
                        type: 'object',
                        description: 'Full solver output. Shape: { id, resources_assigned, planned_start, … }',
                        example: { id: 'SURG-JOH-0001', resources_assigned: { surgeon: 'surgeon_1' }, planned_start: '2026-07-22T09:00' },
                      },
                      created_at: { type: 'string', format: 'date-time' },
                      updated_at: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        404: { description: 'No plan result found for this surgery' },
        500: { description: 'Internal Server Error' },
      },
    },
  },
};
