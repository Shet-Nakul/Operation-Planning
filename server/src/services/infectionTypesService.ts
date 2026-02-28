import { PrismaClient, infection_types } from '@prisma/client';
import { ZodSchema, z } from 'zod';
import { logActivityDirect } from '../middlewares/activityLogger';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

const InfectionTypeSchema: ZodSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export class InfectionTypesService {
  static async list() {
    return prisma.infection_types.findMany();
  }

  static async getById(id: number) {
    return prisma.infection_types.findUnique({ where: { id } });
  }

  static async create(data: any, req: Request, res: Response) {
    const parsed = InfectionTypeSchema.parse(data);
    const created = await prisma.infection_types.create({ data: parsed });
    await logActivityDirect(req, 'CREATE', 'infection_types');
    return created;
  }

  static async update(id: number, data: any, req: Request, res: Response) {
    const parsed = InfectionTypeSchema.parse(data);
    const updated = await prisma.infection_types.update({ where: { id }, data: parsed });
    await logActivityDirect(req, 'UPDATE', 'infection_types');
    return updated;
  }

  static async delete(id: number, req: Request, res: Response) {
    const deleted = await prisma.infection_types.delete({ where: { id } });
    await logActivityDirect(req, 'DELETE', 'infection_types');
    return deleted;
  }
}