import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';

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
    const contract = await prisma.contract.create({
      data: {
        organization_id: validatedData.organization_id,
        contract_id: validatedData.contract_id,
        name: validatedData.name,
        type: validatedData.type,
        status: validatedData.status || "Active",
        staff_tags: validatedData.staff_tags || [],
        configuration: validatedData.configuration || {},
        global_settings: validatedData.global_settings || {},
        metadata: validatedData.metadata || {},
      },
    });
    res.status(201).json(contract);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
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

export async function getContractById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const contract = await prisma.contract.findUnique({
      where: { id: Number(id) },
    });
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    res.json(contract);
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
    res.status(400).json({ error: err.message });
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
