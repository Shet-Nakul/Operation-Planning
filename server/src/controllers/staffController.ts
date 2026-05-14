import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';

const staffSchema = z.object({
  organization_id: z.number(),
  personal_details: z.object({
    staff_id: z.string(),
    name: z.string(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    profile_picture: z.string().optional(),
  }),
  professional_primary_details: z.object({
    department: z.string().optional(),
    designation: z.string().optional(),
    contract_id: z.string().optional(),
    supervisor: z.string().optional(),
  }),
  professional_secondary_details: z.object({
    skills: z.array(z.string()).optional(),
    certifications: z.array(z.string()).optional(),
    roles: z.array(z.string()).optional(),
    role_distribution: z.record(z.number()).optional(),
    weekly_template: z.any().optional(),
    pool_assignments: z.array(z.any()).optional(),
  }),
});

export async function createStaff(req: Request, res: Response) {
  try {
    const validatedData = staffSchema.parse(req.body);
    
    const staff = await prisma.staff.create({
      data: {
        organization_id: validatedData.organization_id,
        staff_id: validatedData.personal_details.staff_id,
        name: validatedData.personal_details.name,
        address: validatedData.personal_details.address,
        phone: validatedData.personal_details.phone,
        email: validatedData.personal_details.email,
        profile_picture: validatedData.personal_details.profile_picture,
        
        department: validatedData.professional_primary_details.department,
        designation: validatedData.professional_primary_details.designation,
        contract_id: validatedData.professional_primary_details.contract_id,
        supervisor: validatedData.professional_primary_details.supervisor,
        
        skills: validatedData.professional_secondary_details.skills || [],
        certifications: validatedData.professional_secondary_details.certifications || [],
        roles: validatedData.professional_secondary_details.roles || [],
        role_distribution: validatedData.professional_secondary_details.role_distribution || {},
        weekly_template: validatedData.professional_secondary_details.weekly_template || {},
        pool_assignments: validatedData.professional_secondary_details.pool_assignments || [],
      },
    });
    
    res.status(201).json(staff);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getStaff(req: Request, res: Response) {
  try {
    const { orgId } = req.query;
    const staff = await prisma.staff.findMany({
      where: orgId ? { organization_id: Number(orgId) } : {},
    });
    res.json(staff);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getStaffById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const staff = await prisma.staff.findUnique({
      where: { id: Number(id) },
    });
    if (!staff) return res.status(404).json({ error: 'Staff member not found' });
    res.json(staff);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateStaff(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = staffSchema.partial().parse(req.body);
    
    // Flatten updated data for Prisma
    const updateData: any = {};
    
    if (validatedData.personal_details) {
      if (validatedData.personal_details.name) updateData.name = validatedData.personal_details.name;
      if (validatedData.personal_details.staff_id) updateData.staff_id = validatedData.personal_details.staff_id;
      if (validatedData.personal_details.address) updateData.address = validatedData.personal_details.address;
      if (validatedData.personal_details.phone) updateData.phone = validatedData.personal_details.phone;
      if (validatedData.personal_details.email) updateData.email = validatedData.personal_details.email;
      if (validatedData.personal_details.profile_picture) updateData.profile_picture = validatedData.personal_details.profile_picture;
    }
    
    if (validatedData.professional_primary_details) {
      if (validatedData.professional_primary_details.department) updateData.department = validatedData.professional_primary_details.department;
      if (validatedData.professional_primary_details.designation) updateData.designation = validatedData.professional_primary_details.designation;
      if (validatedData.professional_primary_details.contract_id) updateData.contract_id = validatedData.professional_primary_details.contract_id;
      if (validatedData.professional_primary_details.supervisor) updateData.supervisor = validatedData.professional_primary_details.supervisor;
    }
    
    if (validatedData.professional_secondary_details) {
      if (validatedData.professional_secondary_details.skills) updateData.skills = validatedData.professional_secondary_details.skills;
      if (validatedData.professional_secondary_details.certifications) updateData.certifications = validatedData.professional_secondary_details.certifications;
      if (validatedData.professional_secondary_details.roles) updateData.roles = validatedData.professional_secondary_details.roles;
      if (validatedData.professional_secondary_details.role_distribution) updateData.role_distribution = validatedData.professional_secondary_details.role_distribution;
      if (validatedData.professional_secondary_details.weekly_template) updateData.weekly_template = validatedData.professional_secondary_details.weekly_template;
      if (validatedData.professional_secondary_details.pool_assignments) updateData.pool_assignments = validatedData.professional_secondary_details.pool_assignments;
    }

    const staff = await prisma.staff.update({
      where: { id: Number(id) },
      data: updateData,
    });
    
    res.json(staff);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteStaff(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.staff.delete({
      where: { id: Number(id) },
    });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
