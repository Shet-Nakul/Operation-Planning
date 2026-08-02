import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';
import { getOrgFilter, getResolvedOrgId } from '../utils/getOrgFilter';

const staffRequestSchema = z.object({
  staff_id: z.string(),
  request_category: z.enum(['LEAVE', 'SHIFT']),
  leave_type_name: z.string().optional(),
  shift: z.string().optional(),
  pool_id: z.string().nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be in YYYY-MM-DD format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date must be in YYYY-MM-DD format'),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  reason: z.string().optional(),
  metadata: z.any().optional(),
});

const staffRequestUpdateSchema = staffRequestSchema.partial();

async function validateRequestPayload(data: z.infer<typeof staffRequestSchema>, organization_id: number) {
  if (data.request_category === 'LEAVE') {
    if (!data.leave_type_name) {
      throw new Error('leave_type_name is required for LEAVE requests');
    }
    if (data.shift && data.shift !== 'V') {
      throw new Error('shift must be "V" for LEAVE requests');
    }
    if (data.pool_id !== undefined && data.pool_id !== null) {
      throw new Error('pool_id must be null for LEAVE requests');
    }
  }
  if (data.request_category === 'SHIFT') {
    if (!data.shift) throw new Error('shift is required for SHIFT requests');
    // validate shift against Shift catalog aliases for this organization
    const shifts = await prisma.shift.findMany({ where: { organization_id } });
    const aliases = new Set(shifts.map(s => s.alias));
    if (!aliases.has(data.shift)) {
      throw new Error('shift must be one of the organization\'s shift aliases');
    }
  }
  if (data.start_date > data.end_date) {
    throw new Error('start_date must be on or before end_date');
  }
}

function formatStaffRequest(request: any) {
  return {
    id: request.id,
    organization_id: request.organization_id,
    staff_id: request.staff?.staff_id ?? request.staff_id,
    request_category: request.request_type,
    leave_type_name: request.leave_type?.name ?? null,
    shift: request.shift_preference,
    start_date: request.start_date,
    end_date: request.end_date,
    status: request.status,
    reason: request.reason,
    requested_by: (request.metadata && (request.metadata.requested_by ?? null)) || null,
    updated_by: (request.metadata && (request.metadata.updated_by ?? null)) || null,
    pool_id: (() => {
      const m = request.metadata as any;
      if (!m) return null;
      if (typeof m.pool_id === 'string') return m.pool_id;
      if (typeof m.pool_id === 'number') return null; // unknown numeric id stored previously
      return null;
    })(),
    metadata: request.metadata,
    created_at: request.created_at,
    updated_at: request.updated_at,
  };
}

export async function createStaffRequest(req: Request, res: Response) {
  try {
    const validatedData = staffRequestSchema.parse(req.body);
    const organization_id = getResolvedOrgId(req);
    if (!organization_id) {
      return res.status(400).json({ error: 'Organization context is required' });
    }
    await validateRequestPayload(validatedData, organization_id);

    let leaveType: any = null;
    if (validatedData.leave_type_name) {
      leaveType = await prisma.leaveType.findFirst({
        where: { organization_id, name: validatedData.leave_type_name },
      });
      if (!leaveType) {
        return res.status(400).json({ error: 'leave_type_name must reference a leave type in this organization' });
      }
    }

    let pool: any = null;
    if (validatedData.pool_id !== undefined && validatedData.pool_id !== null) {
      pool = await prisma.resourcePool.findUnique({ where: { pool_id: validatedData.pool_id } });
      if (!pool || pool.organization_id !== organization_id) {
        return res.status(400).json({ error: 'pool_id must reference a resource pool in this organization' });
      }
    }

    const staff = await prisma.staff.findUnique({ where: { staff_id: validatedData.staff_id } });
    if (!staff || staff.organization_id !== organization_id) {
      return res.status(400).json({ error: 'staff_id must reference a staff member in this organization' });
    }

    const leaveShiftRequest = await prisma.leaveShiftRequest.create({
      data: {
        organization_id,
        staff_id: staff.id,
        request_type: validatedData.request_category,
        leave_type_id: leaveType?.id || undefined,
        shift_preference: validatedData.request_category === 'LEAVE' ? 'V' : validatedData.shift,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date,
        status: validatedData.status || 'PENDING',
        reason: validatedData.reason,
        metadata: { ...(validatedData.metadata || {}), pool_id: validatedData.pool_id ?? null, requested_by: (req as any).user?.id ?? null },
      },
      include: { leave_type: true, staff: true },
    });

    res.status(201).json({ success: true, data: formatStaffRequest(leaveShiftRequest), message: 'Staff request created successfully' });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.issues.map((issue: any) => issue.message).join(', ') });
    }
    return res.status(400).json({ error: err.message || 'Invalid request payload' });
  }
}

export async function getStaffRequests(req: Request, res: Response) {
  try {
    const filter: any = getOrgFilter(req);
    if (req.query.staffId) {
      const s = await prisma.staff.findUnique({ where: { staff_id: String(req.query.staffId) } });
      if (!s) return res.status(400).json({ error: 'staffId query must reference a valid staff_id' });
      filter.staff_id = s.id;
    }
    if (req.query.status) filter.status = String(req.query.status);
    const requests = await prisma.leaveShiftRequest.findMany({
      where: filter,
      include: { leave_type: true, staff: true },
      orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: requests.map(formatStaffRequest) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve leave/shift requests' });
  }
}

export async function getStaffRequestById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const request = await prisma.leaveShiftRequest.findUnique({ where: { id: Number(id) }, include: { leave_type: true, staff: true } });
    if (!request) return res.status(404).json({ error: 'Leave/shift request not found' });
    if (request.organization_id !== getResolvedOrgId(req)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    res.json({ success: true, data: formatStaffRequest(request) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve leave/shift request' });
  }
}

export async function updateStaffRequest(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existingRequest = await prisma.leaveShiftRequest.findUnique({ where: { id: Number(id) }, include: { leave_type: true, staff: true } });
    if (!existingRequest) return res.status(404).json({ error: 'Leave/shift request not found' });
    if (existingRequest.organization_id !== getResolvedOrgId(req)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const validatedData = staffRequestUpdateSchema.parse(req.body);
    const merged: any = {
      staff_id: validatedData.staff_id ?? existingRequest.staff?.staff_id,
      request_category: validatedData.request_category ?? existingRequest.request_type,
      leave_type_name: validatedData.leave_type_name ?? existingRequest.leave_type?.name,
      shift: validatedData.shift ?? existingRequest.shift_preference,
      pool_id: validatedData.pool_id ?? ((existingRequest.metadata as any)?.pool_id ?? null),
      start_date: validatedData.start_date ?? existingRequest.start_date,
      end_date: validatedData.end_date ?? existingRequest.end_date,
      status: validatedData.status ?? existingRequest.status,
      reason: validatedData.reason ?? existingRequest.reason,
      metadata: validatedData.metadata ?? existingRequest.metadata,
    };
    await validateRequestPayload(merged as z.infer<typeof staffRequestSchema>, existingRequest.organization_id);

    let leaveType: any = null;
    if (merged.leave_type_name) {
      leaveType = await prisma.leaveType.findFirst({
        where: { organization_id: existingRequest.organization_id, name: merged.leave_type_name },
      });
      if (!leaveType) {
        return res.status(400).json({ error: 'leave_type_name must reference a leave type in this organization' });
      }
    }

    let pool: any = null;
    if (merged.pool_id !== undefined && merged.pool_id !== null) {
      pool = await prisma.resourcePool.findUnique({ where: { pool_id: merged.pool_id } });
      if (!pool || pool.organization_id !== existingRequest.organization_id) {
        return res.status(400).json({ error: 'pool_id must reference a resource pool in this organization' });
      }
    }

    if (validatedData.staff_id && validatedData.staff_id !== existingRequest.staff?.staff_id) {
      const staff = await prisma.staff.findUnique({ where: { staff_id: validatedData.staff_id } });
      if (!staff || staff.organization_id !== existingRequest.organization_id) {
        return res.status(400).json({ error: 'staff_id must reference a staff member in this organization' });
      }
    }

    const updateData: any = {
      staff_id: existingRequest.staff_id,
      request_type: merged.request_category,
      leave_type_id: leaveType?.id ?? existingRequest.leave_type_id,
      shift_preference: merged.request_category === 'LEAVE' ? 'V' : merged.shift,
      start_date: merged.start_date,
      end_date: merged.end_date,
      status: merged.status,
      reason: merged.reason,
      metadata: { ...(merged.metadata || {}), pool_id: merged.pool_id ?? null, updated_by: (req as any).user?.id ?? null },
    };
    // If staff_id string was provided, resolve to numeric id
    if (merged.staff_id && typeof merged.staff_id === 'string') {
      const staffResolved = await prisma.staff.findUnique({ where: { staff_id: merged.staff_id } });
      if (!staffResolved) return res.status(400).json({ error: 'staff_id must reference a staff member in this organization' });
      updateData.staff_id = staffResolved.id;
    }
    if (validatedData.metadata === undefined) updateData.metadata = existingRequest.metadata || {};

    const updatedRequest = await prisma.leaveShiftRequest.update({
      where: { id: Number(id) },
      data: updateData,
      include: { leave_type: true, staff: true },
    });
    res.json({ success: true, data: formatStaffRequest(updatedRequest), message: 'Staff request updated successfully' });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.issues.map((issue: any) => issue.message).join(', ') });
    }
    return res.status(400).json({ error: err.message || 'Invalid request payload' });
  }
}

export async function deleteStaffRequest(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existingRequest = await prisma.leaveShiftRequest.findUnique({ where: { id: Number(id) } });
    if (!existingRequest) return res.status(404).json({ error: 'Leave/shift request not found' });
    if (existingRequest.organization_id !== getResolvedOrgId(req)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await prisma.leaveShiftRequest.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete leave/shift request' });
  }
}
