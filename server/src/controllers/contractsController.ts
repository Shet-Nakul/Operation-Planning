import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';
import logger from '../config/logger';
import { generateContractId } from '../utils/generateContractId';
import { getOrgFilter } from '../utils/getOrgFilter';
import { markSchedulingDirty } from '../services/schedulingAutoTrigger';

const contractSchema = z.object({
  organization_id: z.number(),
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
    
    // Auto-generate contract_id
    const existingContracts = await prisma.contract.findMany({
      where: {
        organization_id: validatedData.organization_id,
        type: validatedData.type,
      },
      orderBy: { id: 'desc' },
    });
    
    let nextNumber = 1;
    if (existingContracts.length > 0) {
      // Extract the number from the last contract's id
      const lastContractId = existingContracts[0].contract_id;
      const match = lastContractId.match(/-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    
    const contractId = generateContractId(validatedData.type, nextNumber);
    
    const contract = await prisma.contract.create({
      data: {
        organization_id: validatedData.organization_id,
        contract_id: contractId,
        name: validatedData.name,
        type: validatedData.type,
        status: validatedData.status || "Active",
        staff_tags: validatedData.staff_tags || [],
        configuration: validatedData.configuration || {},
        global_settings: validatedData.global_settings || {},
        metadata: validatedData.metadata || {},
      },
    });
    markSchedulingDirty(contract.organization_id);
    res.status(201).json({ success: true, data: contract, message: 'Contract created successfully' });
  } catch (err: any) {
    logger.error('Error creating contract:', err);
    if (err.name === 'ZodError') return res.status(400).json({ error: err.issues.map((i: any) => i.message).join(', ') });
    if (err.code === 'P2002') return res.status(409).json({ error: 'A contract with this contract_id already exists for this organization' });
    res.status(500).json({ error: 'Failed to create contract' });
  }
}

export async function getContracts(req: Request, res: Response) {
  try {
    const contracts = await prisma.contract.findMany({
      where: getOrgFilter(req),
    });
    res.json({ success: true, data: contracts });
  } catch (err: any) {
    logger.error('Error getting contracts:', err);
    res.status(500).json({ error: 'Failed to get contracts' });
  }
}

export async function getContractById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const contract = await prisma.contract.findUnique({
      where: { id: Number(id) },
    });
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    res.json({ success: true, data: contract });
  } catch (err: any) {
    logger.error('Error getting contract by id:', err);
    res.status(500).json({ error: 'Failed to get contract' });
  }
}

export async function updateContract(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existingContract = await prisma.contract.findUnique({
      where: { id: Number(id) },
    });
    if (!existingContract) return res.status(404).json({ error: 'Contract not found' });
    
    const validatedData = contractSchema.partial().parse(req.body);
    const contract = await prisma.contract.update({
      where: { id: Number(id) },
      data: validatedData,
    });
    markSchedulingDirty(contract.organization_id);
    res.json({ success: true, data: contract, message: 'Contract updated successfully' });
  } catch (err: any) {
    logger.error('Error updating contract:', err);
    if (err.name === 'ZodError') return res.status(400).json({ error: err.issues.map((i: any) => i.message).join(', ') });
    res.status(500).json({ error: 'Failed to update contract' });
  }
}

export async function deleteContract(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existingContract = await prisma.contract.findUnique({
      where: { id: Number(id) },
    });
    if (!existingContract) return res.status(404).json({ error: 'Contract not found' });
    
    await prisma.contract.delete({
      where: { id: Number(id) },
    });
    markSchedulingDirty(existingContract.organization_id);
    res.json({ success: true, message: 'Contract deleted successfully' });
  } catch (err: any) {
    logger.error('Error deleting contract:', err);
    res.status(500).json({ error: 'Failed to delete contract' });
  }
}
