import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';
import { getOrgFilter, getResolvedOrgId } from '../utils/getOrgFilter';
import { getRequestIdentity, resolveRequestSupervisors, resolveStaffRequestReviewers, requestReviewerIds, isValidRequestDate, resolveStaffUserIds, isSwapRequest, resolveSwapReviewers, swapVisibilityUserIds } from '../services/staffRequestWorkflow';
import { markPlanningDirty } from '../services/planningAutoTrigger';
import { markSchedulingDirty, queueSwapRostering } from '../services/schedulingAutoTrigger';

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
  swap: z.object({
    target_staff_id: z.string(),
    preferred_shift: z.string(),
  }).optional(),
});

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
    if (data.leave_type_name) throw new Error('leave_type_name is only valid for LEAVE requests');
    if (!data.shift) throw new Error('shift is required for SHIFT requests');
    // validate shift against Shift catalog aliases for this organization
    const shifts = await prisma.shift.findMany({ where: { organization_id } });
    const aliases = new Set(shifts.map(s => s.alias));
    if (data.shift !== 'O' && !aliases.has(data.shift)) {
      throw new Error('shift must be one of the organization\'s shift aliases');
    }
  }
  if (data.start_date > data.end_date) {
    throw new Error('start_date must be on or before end_date');
  }
  if (!isValidRequestDate(data.start_date) || !isValidRequestDate(data.end_date)) throw new Error('Valid calendar dates are required');
  if ((Date.parse(data.end_date) - Date.parse(data.start_date)) / 86400000 > 365) throw new Error('Request date range cannot exceed one year');
}

function formatStaffRequest(request: any) {
  return {
    id: request.id,
    staff_name: request.staff?.name,
    staff_department: request.staff?.department,
    staff_designation: request.staff?.designation,
    can_review: request.can_review ?? false,
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
        where: { organization_id, name: validatedData.leave_type_name, status: 'ACTIVE' },
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

    const actor = (req as any).user;
    const identity = await getRequestIdentity(actor.id, organization_id);
    if (actor.role !== 'ADMIN' && !identity.ownStaff.some(member => member.id === staff.id)) {
      return res.status(403).json({ error: 'You may only submit requests for your own staff profile' });
    }
    if (validatedData.status && validatedData.status !== 'PENDING') return res.status(400).json({ error: 'New requests must be pending' });

    if (validatedData.swap) {
      if (validatedData.request_category !== 'SHIFT') return res.status(400).json({ error: 'Shift swap requests must use the SHIFT category' });
      const colleague = await prisma.staff.findUnique({ where: { staff_id: validatedData.swap.target_staff_id } });
      if (!colleague || colleague.organization_id !== organization_id) return res.status(400).json({ error: 'swap.target_staff_id must reference a staff member in this organization' });
      if (colleague.id === staff.id) return res.status(400).json({ error: 'Cannot request a shift swap with yourself' });
      const shifts = await prisma.shift.findMany({ where: { organization_id } });
      const aliases = new Set(shifts.map(s => s.alias));
      if (validatedData.swap.preferred_shift !== 'O' && !aliases.has(validatedData.swap.preferred_shift)) {
        return res.status(400).json({ error: "swap.preferred_shift must be one of the organization's shift aliases" });
      }
      const targetUserIds = await resolveStaffUserIds(colleague);
      if (!targetUserIds.length) return res.status(400).json({ error: 'The selected colleague has no active login account to receive the swap request' });
      const supervisorIds = await resolveStaffRequestReviewers(staff);
      if (!supervisorIds.filter(id => id !== actor.id).length) return res.status(400).json({ error: 'No other active supervisor account is linked to review the swap. Assign an active supervisor.' });
      const adminIds = await resolveSwapReviewers(staff, { stage: 'ADMIN', requested_by: actor.id });
      if (!adminIds.length) return res.status(400).json({ error: 'No active hospital admin account is available for final approval.' });

      const swapRequest = await prisma.leaveShiftRequest.create({
        data: {
          organization_id,
          staff_id: staff.id,
          request_type: 'SHIFT',
          shift_preference: validatedData.shift,
          start_date: validatedData.start_date,
          end_date: validatedData.end_date,
          status: 'PENDING',
          reason: validatedData.reason,
          metadata: {
            pool_id: validatedData.pool_id ?? null,
            requested_by: actor.id,
            swap: true,
            stage: 'SUPERVISOR',
            target_staff_id: colleague.id,
            target_staff_code: colleague.staff_id,
            target_colleague_name: colleague.name,
            target_user_ids: targetUserIds,
            supervisor_user_ids: supervisorIds,
            admin_user_ids: adminIds,
            own_shift: validatedData.shift,
            preferred_shift: validatedData.swap.preferred_shift,
          },
        },
        include: { leave_type: true, staff: true },
      });
      return res.status(201).json({ success: true, data: formatStaffRequest({ ...swapRequest, can_review: false }), message: 'Shift swap request sent to your supervisor' });
    }

    const reviewerIds = await resolveStaffRequestReviewers(staff);
    if (!reviewerIds.length) return res.status(400).json({ error: 'No active supervisor account is linked, or the staff member is their own supervisor. Assign another active supervisor account.' });

    const leaveShiftRequest = await prisma.leaveShiftRequest.create({
      data: {
        organization_id,
        staff_id: staff.id,
        request_type: validatedData.request_category,
        leave_type_id: leaveType?.id || undefined,
        shift_preference: validatedData.request_category === 'LEAVE' ? 'V' : validatedData.shift,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date,
        status: 'PENDING',
        reason: validatedData.reason,
        metadata: { pool_id: validatedData.pool_id ?? null, requested_by: actor.id, supervisor_user_ids: reviewerIds },
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
    const actor = (req as any).user;
    const identity = await getRequestIdentity(actor.id, getResolvedOrgId(req)!);
    const requests = await prisma.leaveShiftRequest.findMany({
      where: filter,
      include: { leave_type: true, staff: true },
      orderBy: { created_at: 'desc' },
    });
    const routed = await Promise.all(requests.map(async request => {
      const swap = isSwapRequest(request.metadata);
      const actionReviewers = swap
        ? (request.status === 'PENDING' ? await resolveSwapReviewers(request.staff, request.metadata) : [])
        : (request.status === 'PENDING' ? await resolveStaffRequestReviewers(request.staff) : requestReviewerIds(request.metadata));
      const visibilityIds = swap ? [...swapVisibilityUserIds(request.metadata), ...actionReviewers] : actionReviewers;
      const isOwn = identity.ownStaff.some(member => member.id === request.staff_id);
      return { ...request, visibilityIds, can_review: request.status === 'PENDING' && actionReviewers.includes(actor.id) && !isOwn };
    }));
    const visible = routed.filter(request => actor.role === 'ADMIN' || identity.ownStaff.some(member => member.id === request.staff_id) || request.visibilityIds.includes(actor.id));
    res.json({ success: true, data: visible.map(formatStaffRequest) });
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
    const actor = (req as any).user;
    const identity = await getRequestIdentity(actor.id, request.organization_id);
    const swap = isSwapRequest(request.metadata);
    const actionReviewers = swap
      ? (request.status === 'PENDING' ? await resolveSwapReviewers(request.staff, request.metadata) : [])
      : (request.status === 'PENDING' ? await resolveStaffRequestReviewers(request.staff) : requestReviewerIds(request.metadata));
    const visibilityIds = swap ? [...swapVisibilityUserIds(request.metadata), ...actionReviewers] : actionReviewers;
    const isOwnRequest = identity.ownStaff.some(member => member.id === request.staff_id);
    if (actor.role !== 'ADMIN' && !isOwnRequest && !visibilityIds.includes(actor.id)) return res.status(403).json({ error: 'Insufficient permissions' });
    res.json({ success: true, data: formatStaffRequest({ ...request, can_review: request.status === 'PENDING' && !isOwnRequest && actionReviewers.includes(actor.id) }) });
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

    const actor = (req as any).user;
    if (isSwapRequest(existingRequest.metadata)) {
      const meta = (existingRequest.metadata as any) ?? {};
      const stage = meta.stage === 'ADMIN' ? 'ADMIN' : 'SUPERVISOR';
      if (existingRequest.status !== 'PENDING') return res.status(409).json({ error: 'This request has already been reviewed' });
      const actionReviewers = await resolveSwapReviewers(existingRequest.staff, existingRequest.metadata);
      if (!actionReviewers.includes(actor.id)) {
        return res.status(403).json({ error: stage === 'ADMIN' ? 'Only a hospital admin may finalize this swap' : 'Only the assigned supervisor may review this swap' });
      }
      const decision = z.object({ status: z.enum(['APPROVED', 'REJECTED']) }).strict().parse(req.body);
      const now = new Date();
      const nowIso = now.toISOString();
      let data: any;
      let finalize = false;
      if (decision.status === 'REJECTED') {
        data = { status: 'REJECTED', updated_by_at: now, metadata: { ...meta, updated_by: actor.id, reviewed_at: nowIso, [stage === 'ADMIN' ? 'admin_decision' : 'supervisor_decision']: { by: actor.id, status: 'REJECTED', at: nowIso } } };
      } else if (stage === 'SUPERVISOR') {
        const adminIds = await resolveSwapReviewers(existingRequest.staff, { ...meta, stage: 'ADMIN' });
        if (!adminIds.length) return res.status(400).json({ error: 'No active hospital admin account is available for final approval.' });
        data = { updated_by_at: now, metadata: { ...meta, stage: 'ADMIN', admin_user_ids: adminIds, supervisor_user_ids: actionReviewers, updated_by: actor.id, supervisor_decision: { by: actor.id, status: 'APPROVED', at: nowIso } } };
      } else {
        data = { status: 'APPROVED', updated_by_at: now, metadata: { ...meta, admin_user_ids: actionReviewers, updated_by: actor.id, reviewed_at: nowIso, admin_decision: { by: actor.id, status: 'APPROVED', at: nowIso } } };
        finalize = true;
      }
      let poolIds: string[] = [];
      if (finalize) {
        const target = typeof meta.target_staff_code === 'string' ? { staff_id: meta.target_staff_code }
          : typeof meta.target_staff_id === 'number' ? { id: meta.target_staff_id }
          : typeof meta.target_staff_id === 'string' ? { staff_id: meta.target_staff_id } : null;
        if (!target) return res.status(400).json({ error: 'The swap colleague is missing; resubmit this swap before approval.' });
        const participants = await prisma.staff.findMany({
          where: { organization_id: existingRequest.organization_id, OR: [{ id: existingRequest.staff_id }, target] },
        });
        if (participants.length !== 2) return res.status(400).json({ error: 'Both swap participants must still belong to this organization.' });
        poolIds = [...new Set(participants.flatMap(member => {
          const assignments = member.pool_assignments;
          if (!Array.isArray(assignments)) return [];
          return assignments.flatMap(assignment => assignment && typeof assignment === 'object' && !Array.isArray(assignment) && typeof assignment.pool_id === 'string' ? [assignment.pool_id] : []);
        }))];
        if (!poolIds.length) return res.status(400).json({ error: 'Assign the swap participants to a resource pool before final approval so rostering can be retriggered.' });
      }
      const result = await prisma.leaveShiftRequest.updateMany({ where: { id: existingRequest.id, organization_id: existingRequest.organization_id, status: 'PENDING', metadata: { equals: existingRequest.metadata! } }, data });
      if (!result.count) return res.status(409).json({ error: 'This request has already been reviewed' });
      const decidedSwap = await prisma.leaveShiftRequest.findUniqueOrThrow({ where: { id: existingRequest.id }, include: { staff: true, leave_type: true } });
      if (finalize) {
        markPlanningDirty(existingRequest.organization_id);
        queueSwapRostering({
          organizationId: existingRequest.organization_id, requestId: existingRequest.id, poolIds,
          startDate: existingRequest.start_date, endDate: existingRequest.end_date,
        });
      }
      const message = decision.status === 'REJECTED' ? 'Swap request declined' : stage === 'SUPERVISOR' ? 'Forwarded to hospital admin for final approval' : 'Swap approved; affected pool rostering queued';
      return res.json({ success: true, data: formatStaffRequest(decidedSwap), message });
    }

    const reviewers = await resolveStaffRequestReviewers(existingRequest.staff);
    if (!reviewers.includes(actor.id)) return res.status(403).json({ error: 'Only the assigned supervisor may review this request; staff cannot approve their own leave' });
    const decision = z.object({ status: z.enum(['APPROVED', 'REJECTED']) }).strict().parse(req.body);
    const result = await prisma.leaveShiftRequest.updateMany({
      where: { id: existingRequest.id, organization_id: existingRequest.organization_id, status: 'PENDING' },
      data: { status: decision.status, updated_by_at: new Date(), metadata: { ...(existingRequest.metadata as object ?? {}), supervisor_user_ids: reviewers, updated_by: actor.id, reviewed_at: new Date().toISOString() } },
    });
    if (!result.count) return res.status(409).json({ error: 'This request has already been reviewed' });
    const decidedRequest = await prisma.leaveShiftRequest.findUniqueOrThrow({ where: { id: existingRequest.id }, include: { staff: true, leave_type: true } });
    if (decision.status === 'APPROVED') {
      markPlanningDirty(existingRequest.organization_id);
      markSchedulingDirty(existingRequest.organization_id);
    }
    return res.json({ success: true, data: formatStaffRequest(decidedRequest), message: 'Request decision saved' });

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

    const actor = (req as any).user;
    if ((existingRequest.metadata as any)?.requested_by !== actor.id) return res.status(403).json({ error: 'Only the requester may withdraw a pending request' });
    const removed = await prisma.leaveShiftRequest.deleteMany({ where: { id: existingRequest.id, status: 'PENDING' } });
    if (!removed.count) return res.status(409).json({ error: 'Reviewed requests cannot be withdrawn' });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete leave/shift request' });
  }
}

export async function getSupervisorTeam(req: Request, res: Response) {
  try {
    const organizationId = getResolvedOrgId(req);
    if (!organizationId) return res.status(400).json({ error: 'Organization context is required' });
    const identity = await getRequestIdentity((req as any).user.id, organizationId);
    const accounts = await prisma.user.findMany({ where: { organization_id: organizationId, is_active: true, role: { name: { in: ['USER', 'ADMIN'] } } }, include: { role: true } });
    const team = [];
    for (const member of identity.staff) {
      if (identity.ownStaff.some(own => own.id === member.id)) continue;
      try {
        if ((await resolveRequestSupervisors(member, { accounts, profiles: identity.staff })).includes(identity.account.id)) team.push(member);
      } catch {
        continue;
      }
    }
    res.json({ success: true, data: { staff: team, own_staff: identity.ownStaff } });
  } catch {
    res.status(500).json({ error: 'Unable to load supervisor team' });
  }
}
