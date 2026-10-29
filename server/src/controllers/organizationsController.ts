import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';
import { createAuditLog } from '../utils/auditLogger';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { SUPER_ADMIN_ROLE } from '../middlewares/auth';

const organizationSchema = z.object({
  name: z.string().trim().min(1),
  location: z.string().trim().optional(),
  contact_number: z.string().optional(),
  contact_email: z.string().email().optional(),
  status: z.string().optional(),
  initial_admin: z.object({
    first_name: z.string().trim().min(1),
    last_name: z.string().trim().optional(),
    email: z.string().email(),
    password: z.string().min(10).optional(),
  }),
});

export async function createOrganization(req: Request, res: Response) {
  try {
    const validatedData = organizationSchema.parse(req.body);
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    if (!adminRole) return res.status(500).json({ error: 'ADMIN role has not been initialized' });
    const generatedPassword = validatedData.initial_admin.password ?? randomBytes(12).toString('base64url');
    const orgAndAdmin = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: validatedData.name,
          location: validatedData.location,
          contact_number: validatedData.contact_number,
          contact_email: validatedData.contact_email,
          status: validatedData.status,
        },
      });
      const admin = await tx.user.create({
        data: {
          organization_id: organization.id,
          role_id: adminRole.id,
          first_name: validatedData.initial_admin.first_name,
          last_name: validatedData.initial_admin.last_name,
          email: validatedData.initial_admin.email,
          password_hash: await bcrypt.hash(generatedPassword, 10),
        },
      });
      await tx.globalSettings.create({ data: { organization_id: organization.id } });
      return { organization, admin };
    });

    const actor = (req as any).user;
    await createAuditLog({
      action: 'CREATE_ORGANIZATION',
      entity: 'Organization',
      entity_id: String(orgAndAdmin.organization.id),
      user_id: actor?.id,
      organization_id: orgAndAdmin.organization.id,
      description: `Organization ${orgAndAdmin.organization.name} and initial admin created`,
    });

    const { password_hash, refresh_token, ...admin } = orgAndAdmin.admin;
    res.status(201).json({
      organization: orgAndAdmin.organization,
      admin,
      credentials: { email: admin.email, password: generatedPassword },
      emailDelivery: 'not_configured',
      smsDelivery: 'not_configured',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getOrganizations(req: Request, res: Response) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const actor = (req as any).user;
    const where = actor.role === SUPER_ADMIN_ROLE ? {} : { id: actor.organization_id ?? -1 };
    const [orgs, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { created_at: 'desc' },
      }),
      prisma.organization.count({ where }),
    ]);
    res.json({
      data: orgs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getOrganizationStats(req: Request, res: Response) {
  const organizationId = Number(req.params.id);
  const actor = (req as any).user;
  if (!Number.isSafeInteger(organizationId) || organizationId < 1) {
    return res.status(400).json({ error: 'Invalid organization ID' });
  }
  if (actor.role !== SUPER_ADMIN_ROLE && actor.organization_id !== organizationId) {
    return res.status(403).json({ error: 'Organization access denied' });
  }
  try {
    const organization = await prisma.organization.findUnique({ where: { id: organizationId }, select: { id: true } });
    if (!organization) return res.status(404).json({ error: 'Organization not found' });
    const where = { organization_id: organizationId };
    const unitWhere = { pool: { organization_id: organizationId } };
    const [staff, humanPools, assetPools, capacity, units, availableUnits, inventoryItems, inventoryAlerts,
      contracts, departments, users, activeUsers, surgeries, operationTypes] = await prisma.$transaction([
      prisma.staff.count({ where }),
      prisma.resourcePool.count({ where }),
      prisma.renewableResourcePool.count({ where }),
      prisma.renewableResourcePool.aggregate({ where, _sum: { total_capacity: true } }),
      prisma.resourceUnit.count({ where: unitWhere }),
      prisma.resourceUnit.count({ where: { ...unitWhere, status: 'AVAILABLE' } }),
      prisma.nonRenewableResource.count({ where }),
      prisma.nonRenewableResource.count({ where: { ...where, status: { in: ['SHORTAGE', 'OUT_OF_STOCK'] } } }),
      prisma.contract.count({ where }),
      prisma.department.count({ where }),
      prisma.user.count({ where }),
      prisma.user.count({ where: { ...where, is_active: true } }),
      prisma.surgery.count({ where }),
      prisma.operationType.count({ where }),
    ]);
    res.json({ success: true, data: {
      staff, humanPools, assetPools, capacity: capacity._sum.total_capacity ?? 0, units, availableUnits,
      inventoryItems, inventoryAlerts, contracts, departments, users, activeUsers, surgeries, operationTypes,
    } });
  } catch {
    res.status(500).json({ error: 'Failed to load organization statistics' });
  }
}

export async function getOrganizationById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const actor = (req as any).user;
    if (actor.role !== SUPER_ADMIN_ROLE && Number(id) !== actor.organization_id) {
      return res.status(403).json({ error: 'Organization access denied' });
    }
    const org = await prisma.organization.findUnique({
      where: { id: Number(id) },
    });
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    res.json(org);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateOrganization(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const actor = (req as any).user;
    if (actor.role !== SUPER_ADMIN_ROLE && Number(id) !== actor.organization_id) {
      return res.status(403).json({ error: 'Organization access denied' });
    }
    const updateSchema = actor.role === SUPER_ADMIN_ROLE
      ? organizationSchema.omit({ initial_admin: true }).partial()
      : z.object({
        name: z.string().trim().min(1),
        location: z.string().trim().optional(),
        contact_number: z.string().optional(),
        contact_email: z.string().email().optional(),
      }).partial();
    const validatedData = updateSchema.parse(req.body);
    const org = await prisma.organization.update({
      where: { id: Number(id) },
      data: validatedData,
    });

    await createAuditLog({
      action: 'UPDATE_ORGANIZATION',
      entity: 'Organization',
      entity_id: String(org.id),
      user_id: actor?.id,
      organization_id: org.id,
      description: `Organization ${org.name} updated`,
    });

    res.json(org);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteOrganization(req: Request, res: Response) {
  try {
    if ((req as any).user?.role !== SUPER_ADMIN_ROLE) return res.status(403).json({ error: 'Only Super Admin can delete organizations' });
    const { id } = req.params;
    await prisma.organization.delete({
      where: { id: Number(id) },
    });

    const actor = (req as any).user;
    await createAuditLog({
      action: 'DELETE_ORGANIZATION',
      entity: 'Organization',
      entity_id: String(id),
      user_id: actor?.id,
      description: `Organization with ID ${id} deleted`,
    });

    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
