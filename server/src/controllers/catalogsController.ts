import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Schema for StaffTag
const staffTagSchema = z.object({
  organization_id: z.number(),
  name: z.string(),
  color: z.string().optional(),
});

// Schema for Specialization
const specializationSchema = z.object({
  organization_id: z.number(),
  name: z.string(),
  description: z.string().optional(),
});

// Schema for Skill
const skillSchema = z.object({
  organization_id: z.number(),
  name: z.string(),
  description: z.string().optional(),
});

// Schema for Shift
const shiftSchema = z.object({
  organization_id: z.number(),
  name: z.string(),
  alias: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  description: z.string().optional(),
});

/**
 * Handle Prisma unique constraint violation errors
 */
function handleUniqueError(err: any, res: Response, entityName: string) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return res.status(409).json({
      error: `A ${entityName} with this name already exists for this organization.`
    });
  }
  return res.status(400).json({ error: err.message });
}

// --- Staff Tags (Roles) ---
export async function createStaffTag(req: Request, res: Response) {
  try {
    const validatedData = staffTagSchema.parse(req.body);
    const tag = await prisma.staffTag.create({ data: validatedData });
    res.status(201).json(tag);
  } catch (err: any) {
    return handleUniqueError(err, res, 'staff tag');
  }
}

export async function getStaffTags(req: Request, res: Response) {
  try {
    const { orgId } = req.query;
    const tags = await prisma.staffTag.findMany({
      where: orgId ? { organization_id: Number(orgId) } : {},
    });
    res.json(tags);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateStaffTag(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = staffTagSchema.partial().parse(req.body);
    const tag = await prisma.staffTag.update({
      where: { id: Number(id) },
      data: validatedData,
    });
    res.json(tag);
  } catch (err: any) {
    return handleUniqueError(err, res, 'staff tag');
  }
}

export async function deleteStaffTag(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.staffTag.delete({
      where: { id: Number(id) },
    });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// --- Specializations ---
export async function createSpecialization(req: Request, res: Response) {
  try {
    const validatedData = specializationSchema.parse(req.body);
    const specialization = await prisma.specialization.create({ data: validatedData });
    res.status(201).json(specialization);
  } catch (err: any) {
    return handleUniqueError(err, res, 'specialization');
  }
}

export async function getSpecializations(req: Request, res: Response) {
  try {
    const { orgId } = req.query;
    const specializations = await prisma.specialization.findMany({
      where: orgId ? { organization_id: Number(orgId) } : {},
    });
    res.json(specializations);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateSpecialization(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = specializationSchema.partial().parse(req.body);
    const specialization = await prisma.specialization.update({
      where: { id: Number(id) },
      data: validatedData,
    });
    res.json(specialization);
  } catch (err: any) {
    return handleUniqueError(err, res, 'specialization');
  }
}

export async function deleteSpecialization(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.specialization.delete({
      where: { id: Number(id) },
    });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// --- Skills ---
export async function createSkill(req: Request, res: Response) {
  try {
    const validatedData = skillSchema.parse(req.body);
    const skill = await prisma.skill.create({ data: validatedData });
    res.status(201).json(skill);
  } catch (err: any) {
    return handleUniqueError(err, res, 'skill');
  }
}

export async function getSkills(req: Request, res: Response) {
  try {
    const { orgId } = req.query;
    const skills = await prisma.skill.findMany({
      where: orgId ? { organization_id: Number(orgId) } : {},
    });
    res.json(skills);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateSkill(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = skillSchema.partial().parse(req.body);
    const skill = await prisma.skill.update({
      where: { id: Number(id) },
      data: validatedData,
    });
    res.json(skill);
  } catch (err: any) {
    return handleUniqueError(err, res, 'skill');
  }
}

export async function deleteSkill(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.skill.delete({
      where: { id: Number(id) },
    });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// --- Shifts ---
export async function createShift(req: Request, res: Response) {
  try {
    const validatedData = shiftSchema.parse(req.body);
    const shift = await prisma.shift.create({ data: validatedData });
    res.status(201).json(shift);
  } catch (err: any) {
    return handleUniqueError(err, res, 'shift');
  }
}

export async function getShifts(req: Request, res: Response) {
  try {
    const { orgId } = req.query;
    const shifts = await prisma.shift.findMany({
      where: orgId ? { organization_id: Number(orgId) } : {},
    });
    res.json(shifts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateShift(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = shiftSchema.partial().parse(req.body);
    const shift = await prisma.shift.update({
      where: { id: Number(id) },
      data: validatedData,
    });
    res.json(shift);
  } catch (err: any) {
    return handleUniqueError(err, res, 'shift');
  }
}

export async function deleteShift(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.shift.delete({
      where: { id: Number(id) },
    });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// --- Operation Types ---
const operationTypeSchema = z.object({
  organization_id: z.number(),
  category: z.string(),
  name: z.string(),
});

export async function createOperationType(req: Request, res: Response) {
  try {
    const validatedData = operationTypeSchema.parse(req.body);
    const operationType = await prisma.operationType.create({ data: validatedData });
    res.status(201).json(operationType);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getOperationTypes(req: Request, res: Response) {
  try {
    const { orgId } = req.query;
    const operationTypes = await prisma.operationType.findMany({
      where: orgId ? { organization_id: Number(orgId) } : {},
    });
    res.json(operationTypes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateOperationType(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = operationTypeSchema.partial().parse(req.body);
    const operationType = await prisma.operationType.update({
      where: { id: Number(id) },
      data: validatedData,
    });
    res.json(operationType);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteOperationType(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.operationType.delete({
      where: { id: Number(id) },
    });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// --- Phase Resources ---
const phaseResourceSchema = z.object({
  organization_id: z.number(),
  type: z.string(),
  name: z.string(),
  default_count: z.number().optional().default(1),
});

export async function createPhaseResource(req: Request, res: Response) {
  try {
    const validatedData = phaseResourceSchema.parse(req.body);
    const phaseResource = await prisma.phaseResource.create({ data: validatedData });
    res.status(201).json(phaseResource);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getPhaseResources(req: Request, res: Response) {
  try {
    const { orgId } = req.query;
    const phaseResources = await prisma.phaseResource.findMany({
      where: orgId ? { organization_id: Number(orgId) } : {},
    });
    res.json(phaseResources);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updatePhaseResource(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = phaseResourceSchema.partial().parse(req.body);
    const phaseResource = await prisma.phaseResource.update({
      where: { id: Number(id) },
      data: validatedData,
    });
    res.json(phaseResource);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function deletePhaseResource(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.phaseResource.delete({
      where: { id: Number(id) },
    });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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
    res.status(201).json(constraint);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getConstraints(req: Request, res: Response) {
  try {
    const { orgId } = req.query;
    const constraints = await prisma.forbiddenPattern.findMany({
      where: orgId ? { organization_id: Number(orgId) } : {},
    });
    res.json(constraints);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateConstraint(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = constraintSchema.partial().parse(req.body);
    const constraint = await prisma.forbiddenPattern.update({
      where: { id: Number(id) },
      data: validatedData,
    });
    res.json(constraint);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteConstraint(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.forbiddenPattern.delete({
      where: { id: Number(id) },
    });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// --- Contracts ---
const contractSchema = z.object({
  organization_id: z.number(),
  contract_id: z.string(),
  name: z.string(),
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
    res.status(201).json(contract);
  } catch (err: any) {
    return handleUniqueError(err, res, 'contract');
  }
}

export async function getContracts(req: Request, res: Response) {
  try {
    const { orgId } = req.query;
    const contracts = await prisma.contract.findMany({
      where: orgId ? { organization_id: Number(orgId) } : {},
    });
    res.json(contracts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateContract(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = contractSchema.partial().parse(req.body);
    const contract = await prisma.contract.update({
      where: { id: Number(id) },
      data: validatedData,
    });
    res.json(contract);
  } catch (err: any) {
    return handleUniqueError(err, res, 'contract');
  }
}

export async function deleteContract(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.contract.delete({
      where: { id: Number(id) },
    });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
