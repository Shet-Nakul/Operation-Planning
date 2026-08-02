import { OpenAPIV3 } from 'openapi-types';

export const leaveRequestsDocs: OpenAPIV3.PathsObject = {
  '/api/catalogs/leave_types': {
    post: {
      tags: ['Catalogs'],
      summary: 'Create Leave Type',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                organization_id: { type: 'number' },
                name: { type: 'string', example: 'Annual Leave' },
                description: { type: 'string', example: 'Paid annual leave' },
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
      summary: 'Get Leave Types',
      parameters: [{ name: 'orgId', in: 'query', schema: { type: 'number' } }],
      responses: { 200: { description: 'Success' } },
    },
  },
  '/api/catalogs/leave_types/{id}': {
    put: {
      tags: ['Catalogs'],
      summary: 'Update Leave Type',
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
      summary: 'Delete Leave Type',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: {
        204: { description: 'Deleted' },
        409: { description: 'Leave type is in use and cannot be deleted' },
      },
    },
  },
  '/api/staff-requests': {
    post: {
      tags: ['StaffRequests'],
      summary: 'Create Leave or Shift Request',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                staff_id: { type: 'string', example: 'STAFF-0001', description: 'Staff external id' },
                request_category: { type: 'string', enum: ['LEAVE', 'SHIFT'] },
                leave_type_name: { type: 'string', example: 'Annual Leave' },
                shift: { type: 'string', example: 'D', description: 'Shift alias from org shift catalog' },
                pool_id: { type: 'string', nullable: true, description: 'Optional pool external id for SHIFT requests; must be null for LEAVE' },
                start_date: { type: 'string', format: 'date', example: '2026-07-01' },
                end_date: { type: 'string', format: 'date', example: '2026-07-05' },
                status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'], example: 'PENDING' },
                reason: { type: 'string', example: 'Family event' },
                metadata: { type: 'object' },
              },
              required: ['staff_id', 'request_category', 'start_date', 'end_date'],
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Created',
          content: {
            'application/json': {
              example: {
                success: true,
                data: {
                  id: 10,
                  organization_id: 1,
                  staff_id: 'STAFF-0001',
                  request_category: 'LEAVE',
                  leave_type_name: 'Annual Leave',
                  shift: 'V',
                  start_date: '2026-07-01',
                  end_date: '2026-07-05',
                  status: 'PENDING',
                  reason: 'Family event',
                  requested_by: 2,
                  updated_by: null,
                  pool_id: null,
                  metadata: {},
                  created_at: '2026-07-01T12:00:00.000Z',
                  updated_at: '2026-07-01T12:00:00.000Z'
                }
              }
            }
          }
        },
        400: { description: 'Validation error or bad request' },
        403: { description: 'Insufficient permissions or missing organization context' },
      },
    },
    get: {
      tags: ['StaffRequests'],
      summary: 'Get Leave/Shift Requests',
      parameters: [
        { name: 'orgId', in: 'query', schema: { type: 'number' } },
        { name: 'staffId', in: 'query', schema: { type: 'string' } },
        { name: 'status', in: 'query', schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              example: {
                success: true,
                data: [
                  {
                    id: 10,
                    organization_id: 1,
                    staff_id: 'STAFF-0001',
                    request_category: 'LEAVE',
                    leave_type_name: 'Annual Leave',
                    shift: 'V',
                    start_date: '2026-07-01',
                    end_date: '2026-07-05',
                    status: 'PENDING',
                    reason: 'Family event',
                    requested_by: 2,
                    updated_by: null,
                    pool_id: null,
                    metadata: {},
                    created_at: '2026-07-01T12:00:00.000Z',
                    updated_at: '2026-07-01T12:00:00.000Z'
                  }
                ]
              }
            }
          }
        }
      },
    },
  },
  '/api/staff-requests/{id}': {
    // GET by id is not required for creation; list and create are primary.
    put: {
      tags: ['StaffRequests'],
      summary: 'Update Leave/Shift Request',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                staff_id: { type: 'string' },
                request_category: { type: 'string', enum: ['LEAVE', 'SHIFT'] },
                leave_type_name: { type: 'string' },
                shift: { type: 'string' },
                pool_id: { type: 'string', nullable: true },
                start_date: { type: 'string', format: 'date' },
                end_date: { type: 'string', format: 'date' },
                status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
                reason: { type: 'string' },
                metadata: { type: 'object' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Updated' },
        400: { description: 'Validation error or bad request' },
        403: { description: 'Insufficient permissions' },
        404: { description: 'Not found' },
      },
    },
    delete: {
      tags: ['StaffRequests'],
      summary: 'Delete Leave/Shift Request',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
      responses: { 204: { description: 'Deleted' }, 404: { description: 'Not found' } },
    },
  },
};
