import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';
import logger from '../config/logger';
import { generateStaffId } from '../utils/generateStaffId';
import { resolveDepartmentName } from '../utils/resolveDepartmentName';

const nameRegex = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]{0,98}[\p{L}\p{M}]$/u;
const nameValidationMessage = 'Name must start and end with a letter, can include spaces, apostrophes, periods, and dashes, and be between 2-100 characters long.';

// Pool-based day: a pool_id (or null when not pool-specific) plus a shift alias from the org's shift catalog.
// Used when the employee has a pool assigned; invalid/unrecognized aliases are normalized to "O" (off).
const weeklyTemplatePoolDaySchema = z.object({
  pool: z.string().nullable(),
  shift: z.string(),
});

// Role-based day: legacy shape for employees with no pool assignment - a list of {start, end, role} blocks (empty array = day off).
const weeklyTemplateRoleDaySchema = z.array(z.object({
  start: z.string(),
  end: z.string(),
  role: z.string(),
}));

const weeklyTemplateDaySchema = z.union([weeklyTemplatePoolDaySchema, weeklyTemplateRoleDaySchema]);

const weeklyTemplateSchema = z.object({
  monday: weeklyTemplateDaySchema.optional(),
  tuesday: weeklyTemplateDaySchema.optional(),
  wednesday: weeklyTemplateDaySchema.optional(),
  thursday: weeklyTemplateDaySchema.optional(),
  friday: weeklyTemplateDaySchema.optional(),
  saturday: weeklyTemplateDaySchema.optional(),
  sunday: weeklyTemplateDaySchema.optional(),
});

const staffSchema = z.object({
  organization_id: z.number(),
  personal_details: z.object({
    name: z.string().regex(nameRegex, nameValidationMessage),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    profile_picture: z.string().optional(),
  }),
  professional_primary_details: z.object({
    department_id: z.number().optional(),
    designation: z.string().optional(),
    contract_id: z.string().optional(),
    supervisor: z.string().optional(),
  }),
  professional_secondary_details: z.object({
    skills: z.array(z.string()).optional(),
    certifications: z.array(z.string()).optional(),
    roles: z.array(z.string()).optional(),
    role_distribution: z.record(z.number()).optional(),
    weekly_template: weeklyTemplateSchema.optional(),
    pool_assignments: z.array(z.any()).optional(),
  }),
});

type WeeklyTemplate = z.infer<typeof weeklyTemplateSchema>;

// For pool-based days (role-based array days are left untouched), normalizes the shift alias against
// the organization's shift catalog (GET /api/catalogs/shift) - anything not in the catalog becomes "O" (off).
async function normalizeWeeklyTemplateShifts(organizationId: number, weeklyTemplate?: WeeklyTemplate): Promise<WeeklyTemplate | undefined> {
  if (!weeklyTemplate) return weeklyTemplate;

  const entries = Object.entries(weeklyTemplate) as [string, { pool: string | null; shift: string } | { start: string; end: string; role: string }[] | undefined][];
  const hasPoolBasedDay = entries.some(([, entry]) => entry && !Array.isArray(entry));
  if (!hasPoolBasedDay) return weeklyTemplate;

  const shifts = await prisma.shift.findMany({
    where: { organization_id: organizationId },
    select: { alias: true },
  });
  const validAliases = new Set(shifts.map(s => s.alias));

  const normalized: Record<string, unknown> = {};
  for (const [day, entry] of entries) {
    if (entry && !Array.isArray(entry)) {
      normalized[day] = { pool: entry.pool, shift: validAliases.has(entry.shift) ? entry.shift : 'O' };
    } else {
      normalized[day] = entry;
    }
  }
  return normalized as WeeklyTemplate;
}

export async function createStaff(req: Request, res: Response) {
  try {
    const validatedData = staffSchema.parse(req.body);

    const normalizedWeeklyTemplate = await normalizeWeeklyTemplateShifts(
      validatedData.organization_id,
      validatedData.professional_secondary_details.weekly_template
    );

    // Get all existing staff for this organization
    const existingStaff = await prisma.staff.findMany({
      where: { organization_id: validatedData.organization_id }
    });

    // Find the maximum number from existing staff_ids
    let maxNumber = 0;
    existingStaff.forEach(s => {
      const match = s.staff_id.match(/-(\d{4})$/);
      if (match && parseInt(match[1]) > maxNumber) {
        maxNumber = parseInt(match[1]);
      }
    });
    const nextNumber = maxNumber + 1;
    const staff_id = generateStaffId(validatedData.personal_details.name, nextNumber);

    const staff = await prisma.staff.create({
      data: {
        organization_id: validatedData.organization_id,
        staff_id: staff_id,
        name: validatedData.personal_details.name,
        address: validatedData.personal_details.address,
        phone: validatedData.personal_details.phone,
        email: validatedData.personal_details.email,
        profile_picture: validatedData.personal_details.profile_picture,
        
        department_id: validatedData.professional_primary_details.department_id,
        department: await resolveDepartmentName(validatedData.professional_primary_details.department_id),
        designation: validatedData.professional_primary_details.designation,
        contract_id: validatedData.professional_primary_details.contract_id,
        supervisor: validatedData.professional_primary_details.supervisor,
        
        skills: validatedData.professional_secondary_details.skills || [],
        certifications: validatedData.professional_secondary_details.certifications || [],
        roles: validatedData.professional_secondary_details.roles || [],
        role_distribution: validatedData.professional_secondary_details.role_distribution || {},
        weekly_template: normalizedWeeklyTemplate || {},
        pool_assignments: validatedData.professional_secondary_details.pool_assignments || [],
      },
    });
    
    res.status(201).json({ success: true, data: staff, message: 'Staff member created successfully' });
  } catch (err: any) {
    logger.error('Error in createStaff', err);
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.issues.map((issue: any) => issue.message).join(', ') });
    }
    res.status(500).json({ error: 'An unexpected error occurred while creating the staff member' });
  }
}

export async function getStaff(req: Request, res: Response) {
  try {
    const { orgId } = req.query;
    const staff = await prisma.staff.findMany({
      where: orgId ? { organization_id: Number(orgId) } : {},
    });
    res.json({ success: true, data: staff });
  } catch (err: any) {
    logger.error('Error in getStaff', err);
    res.status(500).json({ error: 'An unexpected error occurred while retrieving staff members' });
  }
}

export async function getStaffById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const staff = await prisma.staff.findUnique({
      where: { id: Number(id) },
    });
    if (!staff) return res.status(404).json({ error: 'Staff member not found' });
    res.json({ success: true, data: staff });
  } catch (err: any) {
    logger.error('Error in getStaffById', err);
    res.status(500).json({ error: 'An unexpected error occurred while retrieving the staff member' });
  }
}

export async function updateStaff(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = staffSchema.partial().parse(req.body);
    
    // Check if staff exists first
    const existingStaff = await prisma.staff.findUnique({
      where: { id: Number(id) },
    });
    if (!existingStaff) return res.status(404).json({ error: 'Staff member not found' });

    const normalizedWeeklyTemplate = await normalizeWeeklyTemplateShifts(
      existingStaff.organization_id,
      validatedData.professional_secondary_details?.weekly_template
    );

    // Flatten updated data for Prisma
    const updateData: any = {};
    
    if (validatedData.personal_details) {
      if (validatedData.personal_details.name) updateData.name = validatedData.personal_details.name;
      if (validatedData.personal_details.address) updateData.address = validatedData.personal_details.address;
      if (validatedData.personal_details.phone) updateData.phone = validatedData.personal_details.phone;
      if (validatedData.personal_details.email) updateData.email = validatedData.personal_details.email;
      if (validatedData.personal_details.profile_picture) updateData.profile_picture = validatedData.personal_details.profile_picture;
    }
    
    if (validatedData.professional_primary_details) {
      if (validatedData.professional_primary_details.department_id !== undefined) {
        updateData.department_id = validatedData.professional_primary_details.department_id;
        updateData.department = await resolveDepartmentName(validatedData.professional_primary_details.department_id);
      }
      if (validatedData.professional_primary_details.designation) updateData.designation = validatedData.professional_primary_details.designation;
      if (validatedData.professional_primary_details.contract_id) updateData.contract_id = validatedData.professional_primary_details.contract_id;
      if (validatedData.professional_primary_details.supervisor) updateData.supervisor = validatedData.professional_primary_details.supervisor;
    }
    
    if (validatedData.professional_secondary_details) {
      if (validatedData.professional_secondary_details.skills) updateData.skills = validatedData.professional_secondary_details.skills;
      if (validatedData.professional_secondary_details.certifications) updateData.certifications = validatedData.professional_secondary_details.certifications;
      if (validatedData.professional_secondary_details.roles) updateData.roles = validatedData.professional_secondary_details.roles;
      if (validatedData.professional_secondary_details.role_distribution) updateData.role_distribution = validatedData.professional_secondary_details.role_distribution;
      if (validatedData.professional_secondary_details.weekly_template) updateData.weekly_template = normalizedWeeklyTemplate;
      if (validatedData.professional_secondary_details.pool_assignments) updateData.pool_assignments = validatedData.professional_secondary_details.pool_assignments;
    }

    const staff = await prisma.staff.update({
      where: { id: Number(id) },
      data: updateData,
    });
    
    res.json({ success: true, data: staff, message: 'Staff member updated successfully' });
  } catch (err: any) {
    logger.error('Error in updateStaff', err);
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.issues.map((issue: any) => issue.message).join(', ') });
    }
    res.status(500).json({ error: 'An unexpected error occurred while updating the staff member' });
  }
}

export async function deleteStaff(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Check if staff exists first
    const existingStaff = await prisma.staff.findUnique({
      where: { id: Number(id) },
    });
    if (!existingStaff) return res.status(404).json({ error: 'Staff member not found' });
    
    await prisma.staff.delete({
      where: { id: Number(id) },
    });
    
    res.json({ success: true, message: 'Staff member deleted successfully' });
  } catch (err: any) {
    logger.error('Error in deleteStaff', err);
    res.status(500).json({ error: 'An unexpected error occurred while deleting the staff member' });
  }
}
