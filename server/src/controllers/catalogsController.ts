import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import logger from '../config/logger';
import { slugify } from '../utils/slugify';
import { getOrgFilter } from '../utils/getOrgFilter';

const nameRegex = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]{0,98}[\p{L}\p{M}]$/u;
const nameValidationMessage = 'Name must start and end with a letter, can include spaces, apostrophes, periods, and dashes, and be between 2-100 characters long.';

// Schema for StaffTag
const staffTagSchema = z.object({
  organization_id: z.number(),
  name: z.string().regex(nameRegex, nameValidationMessage),
  color: z.string().optional(),
  status: z.string().optional(),
});

// Schema for ResourceType
const resourceTypeSchema = z.object({
  organization_id: z.number(),
  name: z.string().regex(nameRegex, nameValidationMessage),
  status: z.string().optional(),
});

// Schema for SurgeryStatusCatalog
const surgeryStatusCatalogSchema = z.object({
  organization_id: z.number(),
  name: z.string(),
  to_plan: z.boolean(),
  description: z.string().optional(),
});

// Schema for Specialization
const specializationSchema = z.object({
  organization_id: z.number(),
  name: z.string().regex(nameRegex, nameValidationMessage),
  description: z.string().optional(),
  status: z.string().optional(),
});

// Schema for Skill
const skillSchema = z.object({
  organization_id: z.number(),
  name: z.string().regex(nameRegex, nameValidationMessage),
  description: z.string().optional(),
  status: z.string().optional(),
});

// Schema for Department
const departmentSchema = z.object({
  organization_id: z.number(),
  name: z.string().regex(nameRegex, nameValidationMessage),
  description: z.string().optional(),
  status: z.string().optional(),
});

// Schema for Shift
const shiftSchema = z.object({
  organization_id: z.number(),
  name: z.string().regex(nameRegex, nameValidationMessage),
  alias: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  description: z.string().optional(),
  status: z.string().optional(),
});

/**
 * Central catalog error handler — distinguishes validation (400), conflicts (409),
 * not-found (404), and server errors (500) rather than collapsing everything to 400.
 */
function handleCatalogError(err: any, res: Response, entityName: string) {
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: err.issues.map((i: any) => i.message).join(', ') });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: `A ${entityName} with this name already exists for this organization.` });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: `${entityName} not found.` });
    }
  }
  logger.error(`Error in ${entityName} operation`, err);
  return res.status(500).json({ error: `An unexpected error occurred.` });
}

// Keep for backward compat with existing callers
function handleUniqueError(err: any, res: Response, entityName: string) {
  return handleCatalogError(err, res, entityName);
}

/**
 * Blocks deletion of a catalog entry that's still referenced elsewhere, suggesting
 * deactivation (status: "INACTIVE") instead. Returns true if the response was sent (caller should stop).
 */
function blockDeleteIfInUse(res: Response, entityName: string, usages: string[]): boolean {
  if (usages.length === 0) return false;
  res.status(409).json({
    error: `Cannot delete this ${entityName} because it is used by ${usages.join(' and ')}. Set its status to "INACTIVE" instead if you need to disable it.`
  });
  return true;
}

// --- Usage checks (catalogs are mostly referenced via free-text JSON fields, not real FKs,
// so these scan the relevant tables rather than relying on relational constraints) ---

async function checkStaffTagUsage(organizationId: number, name: string): Promise<string[]> {
  const usages: string[] = [];
  const nameSlug = slugify(name);

  const staff = await prisma.staff.findMany({ where: { organization_id: organizationId }, select: { roles: true } });
  const staffCount = staff.filter(s => ((s.roles as string[]) || []).includes(name)).length;
  if (staffCount > 0) usages.push(`${staffCount} staff member(s)`);

  const surgeries = await prisma.surgery.findMany({ where: { organization_id: organizationId }, select: { stages: true } });
  const surgeryCount = surgeries.filter(s => {
    const stages = (s.stages as Record<string, Array<{ role?: string }>>) || {};
    return Object.values(stages).some(entries => (entries || []).some(e => slugify(e.role || '') === nameSlug));
  }).length;
  if (surgeryCount > 0) usages.push(`${surgeryCount} surgery stage requirement(s)`);

  return usages;
}

async function checkResourceTypeUsage(organizationId: number, name: string): Promise<string[]> {
  const count = await prisma.renewableResourcePool.count({
    where: { organization_id: organizationId, resource_type: name },
  });
  return count > 0 ? [`${count} renewable resource pool(s)`] : [];
}

async function checkSkillUsage(organizationId: number, name: string): Promise<string[]> {
  const staff = await prisma.staff.findMany({ where: { organization_id: organizationId }, select: { skills: true } });
  const count = staff.filter(s => ((s.skills as string[]) || []).includes(name)).length;
  return count > 0 ? [`${count} staff member(s)`] : [];
}

// Specialization isn't referenced by any other entity in the current data model - never blocks.
async function checkSpecializationUsage(_organizationId: number, _name: string): Promise<string[]> {
  return [];
}

async function checkDepartmentUsage(departmentId: number): Promise<string[]> {
  const usages: string[] = [];
  const [staffCount, poolCount, surgeryCount] = await Promise.all([
    prisma.staff.count({ where: { department_id: departmentId } }),
    prisma.resourcePool.count({ where: { department_id: departmentId } }),
    prisma.surgery.count({ where: { department_id: departmentId } }),
  ]);
  if (staffCount > 0) usages.push(`${staffCount} staff member(s)`);
  if (poolCount > 0) usages.push(`${poolCount} resource pool(s)`);
  if (surgeryCount > 0) usages.push(`${surgeryCount} surgery/surgeries`);
  return usages;
}

async function checkShiftUsage(organizationId: number, shift: { name: string; alias: string }): Promise<string[]> {
  const usages: string[] = [];

  const staff = await prisma.staff.findMany({ where: { organization_id: organizationId }, select: { weekly_template: true } });
  const staffCount = staff.filter(s => {
    const template = (s.weekly_template as Record<string, any>) || {};
    return Object.values(template).some(day => day && !Array.isArray(day) && day.shift === shift.alias);
  }).length;
  if (staffCount > 0) usages.push(`${staffCount} staff member(s)`);

  const pools = await prisma.resourcePool.findMany({
    where: { organization_id: organizationId },
    include: { demand_configs: true },
  });
  const poolCount = pools.filter(p =>
    p.demand_configs.some(dc => ((dc.demand_matrix as Array<{ shift?: string }>) || []).some(row => row.shift === shift.name))
  ).length;
  if (poolCount > 0) usages.push(`${poolCount} resource pool demand configuration(s)`);

  return usages;
}

// OperationType isn't referenced by any other entity in the current data model - never blocks.
async function checkOperationTypeUsage(_organizationId: number, _name: string): Promise<string[]> {
  return [];
}

// PhaseResource isn't referenced by any other entity in the current data model - never blocks.
async function checkPhaseResourceUsage(_organizationId: number, _name: string): Promise<string[]> {
  return [];
}

// --- Staff Tags (Roles) ---
export async function createStaffTag(req: Request, res: Response) {
  try {
    const validatedData = staffTagSchema.parse(req.body);
    const tag = await prisma.staffTag.create({ data: validatedData });
    res.status(201).json({ success: true, data: tag, message: 'Staff tag created successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'staff tag');
  }
}

export async function getStaffTags(req: Request, res: Response) {
  try {
    const tags = await prisma.staffTag.findMany({
      where: getOrgFilter(req),
    });
    res.json({ success: true, data: tags });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve staff tags' });
  }
}

export async function updateStaffTag(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.staffTag.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: 'Staff tag not found' });

    const validatedData = staffTagSchema.partial().parse(req.body);
    const tag = await prisma.staffTag.update({ where: { id: Number(id) }, data: validatedData });
    res.json({ success: true, data: tag, message: 'Staff tag updated successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'staff tag');
  }
}

export async function deleteStaffTag(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const tag = await prisma.staffTag.findUnique({ where: { id: Number(id) } });
    if (!tag) return res.status(404).json({ error: 'Staff tag not found' });

    const usages = await checkStaffTagUsage(tag.organization_id, tag.name);
    if (blockDeleteIfInUse(res, 'role', usages)) return;

    await prisma.staffTag.delete({ where: { id: Number(id) } });
    res.json({ success: true, message: 'Staff tag deleted successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'staff tag');
  }
}

// --- Resource Types ---
export async function createResourceType(req: Request, res: Response) {
  try {
    const validatedData = resourceTypeSchema.parse(req.body);
    const resourceType = await prisma.resourceType.create({ data: validatedData });
    res.status(201).json({ success: true, data: resourceType, message: 'Resource type created successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'resource type');
  }
}

export async function getResourceTypes(req: Request, res: Response) {
  try {
    const resourceTypes = await prisma.resourceType.findMany({
      where: getOrgFilter(req),
    });
    res.json({ success: true, data: resourceTypes });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve resource types' });
  }
}

export async function updateResourceType(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.resourceType.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: 'Resource type not found' });

    const validatedData = resourceTypeSchema.partial().parse(req.body);
    const resourceType = await prisma.resourceType.update({ where: { id: Number(id) }, data: validatedData });
    res.json({ success: true, data: resourceType, message: 'Resource type updated successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'resource type');
  }
}

export async function deleteResourceType(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const resourceType = await prisma.resourceType.findUnique({ where: { id: Number(id) } });
    if (!resourceType) return res.status(404).json({ error: 'Resource type not found' });

    const usages = await checkResourceTypeUsage(resourceType.organization_id, resourceType.name);
    if (blockDeleteIfInUse(res, 'resource type', usages)) return;

    await prisma.resourceType.delete({ where: { id: Number(id) } });
    res.json({ success: true, message: 'Resource type deleted successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'resource type');
  }
}

// --- Surgery Status Catalog ---
export async function createSurgeryStatus(req: Request, res: Response) {
  try {
    const validatedData = surgeryStatusCatalogSchema.parse(req.body);
    const entry = await prisma.surgeryStatusCatalog.create({ data: validatedData });
    res.status(201).json({ success: true, data: entry, message: 'Surgery status created successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'surgery status');
  }
}

export async function getSurgeryStatuses(req: Request, res: Response) {
  try {
    const entries = await prisma.surgeryStatusCatalog.findMany({
      where: getOrgFilter(req),
      orderBy: { id: 'asc' },
    });
    res.json({ success: true, data: entries });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve surgery statuses' });
  }
}

export async function updateSurgeryStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.surgeryStatusCatalog.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: 'Surgery status not found' });

    const validatedData = surgeryStatusCatalogSchema.partial().parse(req.body);
    const entry = await prisma.surgeryStatusCatalog.update({ where: { id: Number(id) }, data: validatedData });
    res.json({ success: true, data: entry, message: 'Surgery status updated successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'surgery status');
  }
}

export async function deleteSurgeryStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.surgeryStatusCatalog.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: 'Surgery status not found' });

    await prisma.surgeryStatusCatalog.delete({ where: { id: Number(id) } });
    res.json({ success: true, message: 'Surgery status deleted successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'surgery status');
  }
}

// --- Specializations ---
export async function createSpecialization(req: Request, res: Response) {
  try {
    const validatedData = specializationSchema.parse(req.body);
    const specialization = await prisma.specialization.create({ data: validatedData });
    res.status(201).json({ success: true, data: specialization, message: 'Specialization created successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'specialization');
  }
}

export async function getSpecializations(req: Request, res: Response) {
  try {
    const specializations = await prisma.specialization.findMany({
      where: getOrgFilter(req),
    });
    res.json({ success: true, data: specializations });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve specializations' });
  }
}

export async function updateSpecialization(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.specialization.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: 'Specialization not found' });

    const validatedData = specializationSchema.partial().parse(req.body);
    const specialization = await prisma.specialization.update({ where: { id: Number(id) }, data: validatedData });
    res.json({ success: true, data: specialization, message: 'Specialization updated successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'specialization');
  }
}

export async function deleteSpecialization(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const specialization = await prisma.specialization.findUnique({ where: { id: Number(id) } });
    if (!specialization) return res.status(404).json({ error: 'Specialization not found' });

    const usages = await checkSpecializationUsage(specialization.organization_id, specialization.name);
    if (blockDeleteIfInUse(res, 'specialization', usages)) return;

    await prisma.specialization.delete({ where: { id: Number(id) } });
    res.json({ success: true, message: 'Specialization deleted successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'specialization');
  }
}

// --- Skills ---
export async function createSkill(req: Request, res: Response) {
  try {
    const validatedData = skillSchema.parse(req.body);
    const skill = await prisma.skill.create({ data: validatedData });
    res.status(201).json({ success: true, data: skill, message: 'Skill created successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'skill');
  }
}

export async function getSkills(req: Request, res: Response) {
  try {
    const skills = await prisma.skill.findMany({
      where: getOrgFilter(req),
    });
    res.json({ success: true, data: skills });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve skills' });
  }
}

export async function updateSkill(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.skill.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: 'Skill not found' });

    const validatedData = skillSchema.partial().parse(req.body);
    const skill = await prisma.skill.update({ where: { id: Number(id) }, data: validatedData });
    res.json({ success: true, data: skill, message: 'Skill updated successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'skill');
  }
}

export async function deleteSkill(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.skill.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const usages = await checkSkillUsage(existing.organization_id, existing.name);
    if (blockDeleteIfInUse(res, 'skill', usages)) return;

    await prisma.skill.delete({ where: { id: Number(id) } });
    res.json({ success: true, message: 'Skill deleted successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'skill');
  }
}

// --- Departments ---
export async function createDepartment(req: Request, res: Response) {
  try {
    const validatedData = departmentSchema.parse(req.body);
    const department = await prisma.department.create({ data: validatedData });
    res.status(201).json({ success: true, data: department, message: 'Department created successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'department');
  }
}

export async function getDepartments(req: Request, res: Response) {
  try {
    const departments = await prisma.department.findMany({
      where: getOrgFilter(req),
    });
    res.json({ success: true, data: departments });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve departments' });
  }
}

export async function updateDepartment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.department.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Department not found' });
    }
    const validatedData = departmentSchema.partial().parse(req.body);
    const department = await prisma.department.update({
      where: { id: Number(id) },
      data: validatedData,
    });
    res.json({ success: true, data: department, message: 'Department updated successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'department');
  }
}

export async function deleteDepartment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.department.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const usages = await checkDepartmentUsage(existing.id);
    if (blockDeleteIfInUse(res, 'department', usages)) return;

    await prisma.department.delete({
      where: { id: Number(id) },
    });
    res.status(200).json({ success: true, message: 'Department deleted successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'department');
  }
}

// --- Shifts ---
export async function createShift(req: Request, res: Response) {
  try {
    const validatedData = shiftSchema.parse(req.body);
    const shift = await prisma.shift.create({ data: validatedData });
    res.status(201).json({ success: true, data: shift, message: 'Shift created successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'shift');
  }
}

export async function getShifts(req: Request, res: Response) {
  try {
    const shifts = await prisma.shift.findMany({
      where: getOrgFilter(req),
    });
    res.json({ success: true, data: shifts });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve shifts' });
  }
}

export async function updateShift(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.shift.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: 'Shift not found' });

    const validatedData = shiftSchema.partial().parse(req.body);
    const shift = await prisma.shift.update({ where: { id: Number(id) }, data: validatedData });
    res.json({ success: true, data: shift, message: 'Shift updated successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'shift');
  }
}

export async function deleteShift(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const shift = await prisma.shift.findUnique({ where: { id: Number(id) } });
    if (!shift) return res.status(404).json({ error: 'Shift not found' });

    const usages = await checkShiftUsage(shift.organization_id, shift);
    if (blockDeleteIfInUse(res, 'shift', usages)) return;

    await prisma.shift.delete({ where: { id: Number(id) } });
    res.json({ success: true, message: 'Shift deleted successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'shift');
  }
}

// --- Operation Types ---
const operationTypeSchema = z.object({
  organization_id: z.number(),
  category: z.string(),
  name: z.string().regex(nameRegex, nameValidationMessage),
  status: z.string().optional(),
});

export async function createOperationType(req: Request, res: Response) {
  try {
    const validatedData = operationTypeSchema.parse(req.body);
    const operationType = await prisma.operationType.create({ data: validatedData });
    res.status(201).json({ success: true, data: operationType, message: 'Operation type created successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'operation type');
  }
}

export async function getOperationTypes(req: Request, res: Response) {
  try {
    const operationTypes = await prisma.operationType.findMany({
      where: getOrgFilter(req),
    });
    res.json({ success: true, data: operationTypes });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve operation types' });
  }
}

export async function updateOperationType(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.operationType.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: 'Operation type not found' });

    const validatedData = operationTypeSchema.partial().parse(req.body);
    const operationType = await prisma.operationType.update({ where: { id: Number(id) }, data: validatedData });
    res.json({ success: true, data: operationType, message: 'Operation type updated successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'operation type');
  }
}

export async function deleteOperationType(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const operationType = await prisma.operationType.findUnique({ where: { id: Number(id) } });
    if (!operationType) return res.status(404).json({ error: 'Operation type not found' });

    const usages = await checkOperationTypeUsage(operationType.organization_id, operationType.name);
    if (blockDeleteIfInUse(res, 'operation type', usages)) return;

    await prisma.operationType.delete({ where: { id: Number(id) } });
    res.json({ success: true, message: 'Operation type deleted successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'operation type');
  }
}

// --- Phase Resources ---
const phaseResourceSchema = z.object({
  organization_id: z.number(),
  type: z.string(),
  name: z.string().regex(nameRegex, nameValidationMessage),
  default_count: z.number().optional().default(1),
  status: z.string().optional(),
});

export async function createPhaseResource(req: Request, res: Response) {
  try {
    const validatedData = phaseResourceSchema.parse(req.body);
    const phaseResource = await prisma.phaseResource.create({ data: validatedData });
    res.status(201).json({ success: true, data: phaseResource, message: 'Phase resource created successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'phase resource');
  }
}

export async function getPhaseResources(req: Request, res: Response) {
  try {
    const phaseResources = await prisma.phaseResource.findMany({
      where: getOrgFilter(req),
    });
    res.json({ success: true, data: phaseResources });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve phase resources' });
  }
}

export async function updatePhaseResource(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.phaseResource.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: 'Phase resource not found' });

    const validatedData = phaseResourceSchema.partial().parse(req.body);
    const phaseResource = await prisma.phaseResource.update({ where: { id: Number(id) }, data: validatedData });
    res.json({ success: true, data: phaseResource, message: 'Phase resource updated successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'phase resource');
  }
}

export async function deletePhaseResource(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const phaseResource = await prisma.phaseResource.findUnique({ where: { id: Number(id) } });
    if (!phaseResource) return res.status(404).json({ error: 'Phase resource not found' });

    const usages = await checkPhaseResourceUsage(phaseResource.organization_id, phaseResource.name);
    if (blockDeleteIfInUse(res, 'phase resource', usages)) return;

    await prisma.phaseResource.delete({ where: { id: Number(id) } });
    res.json({ success: true, message: 'Phase resource deleted successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'phase resource');
  }
}

// --- Constraints (Forbidden Patterns) ---
const constraintSchema = z.object({
  organization_id: z.number(),
  scope: z.string().optional(),
  applies_to: z.string().optional(),
  forbidden_patterns: z.array(z.any()),
  metadata: z.any().optional(),
});

export async function createConstraint(req: Request, res: Response) {
  try {
    const validatedData = constraintSchema.parse(req.body);
    const constraint = await prisma.forbiddenPattern.create({
      data: {
        organization_id: validatedData.organization_id,
        scope: validatedData.scope || "GLOBAL",
        applies_to: validatedData.applies_to || "ALL_CONTRACT_TYPES",
        forbidden_patterns: validatedData.forbidden_patterns,
        metadata: validatedData.metadata || {},
      },
    });
    res.status(201).json({ success: true, data: constraint, message: 'Constraint created successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'constraint');
  }
}

export async function getConstraints(req: Request, res: Response) {
  try {
    const constraints = await prisma.forbiddenPattern.findMany({
      where: getOrgFilter(req),
    });
    res.json({ success: true, data: constraints });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve constraints' });
  }
}

export async function updateConstraint(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.forbiddenPattern.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: 'Constraint not found' });

    const validatedData = constraintSchema.partial().parse(req.body);
    const constraint = await prisma.forbiddenPattern.update({ where: { id: Number(id) }, data: validatedData });
    res.json({ success: true, data: constraint, message: 'Constraint updated successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'constraint');
  }
}

export async function deleteConstraint(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.forbiddenPattern.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: 'Constraint not found' });

    await prisma.forbiddenPattern.delete({ where: { id: Number(id) } });
    res.json({ success: true, message: 'Constraint deleted successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'constraint');
  }
}

// --- Contracts ---
const contractSchema = z.object({
  organization_id: z.number(),
  contract_id: z.string(),
  name: z.string().regex(nameRegex, nameValidationMessage),
  type: z.enum(['STATIC', 'DYNAMIC']),
  status: z.string().optional(),
  staff_tags: z.array(z.string()).optional(),
  configuration: z.any().optional(),
  global_settings: z.any().optional(),
  metadata: z.any().optional(),
});

export async function createContract(req: Request, res: Response) {
  try {
    const validatedData = contractSchema.parse(req.body);
    const contract = await prisma.contract.create({ data: validatedData });
    res.status(201).json({ success: true, data: contract, message: 'Contract created successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'contract');
  }
}

export async function getContracts(req: Request, res: Response) {
  try {
    const contracts = await prisma.contract.findMany({
      where: getOrgFilter(req),
    });
    res.json({ success: true, data: contracts });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve contracts' });
  }
}

export async function updateContract(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.contract.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: 'Contract not found' });

    const validatedData = contractSchema.partial().parse(req.body);
    const contract = await prisma.contract.update({ where: { id: Number(id) }, data: validatedData });
    res.json({ success: true, data: contract, message: 'Contract updated successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'contract');
  }
}

export async function deleteContract(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.contract.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: 'Contract not found' });

    await prisma.contract.delete({ where: { id: Number(id) } });
    res.json({ success: true, message: 'Contract deleted successfully' });
  } catch (err: any) {
    return handleCatalogError(err, res, 'contract');
  }
}
