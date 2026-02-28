import { PrismaClient } from '@prisma/client';
import { ZodSchema, z } from 'zod';
import { logActivityDirect } from '../middlewares/activityLogger';
import { Request } from 'express';

const prisma = new PrismaClient();

const PhaseSchema: ZodSchema = z.object({
  phase_id: z.number(),
  required_count: z.number(),
  start_offset_min: z.number(),
  end_offset_min: z.number(),
  assigned: z.number().optional(),
  candidates: z.array(z.number()).optional()
});

export class SurgeryPhaseRequirementsService {
  static async list() {
    return prisma.surgery_phase_requirements.findMany();
  }

  static async getById(id: number) {
    return prisma.surgery_phase_requirements.findUnique({ where: { id } });
  }

  static async create(data: any, req: Request) {
    // Expect: { organization_id, operation_id, phases: [ ... ] }
    const { organization_id, operation_id, phases } = data;

    if (!organization_id || !operation_id || !Array.isArray(phases) || phases.length === 0) {
      throw new Error('organization_id, operation_id, and non-empty phases array are required.');
    }

    const ids: number[] = [];
    for (const phase of phases) {
      // Only one of assigned or candidates must be present
      if ((phase.assigned !== undefined && phase.candidates !== undefined)) {
        throw new Error('Send either "assigned" or "candidates", not both, for each phase.');
      }
      if (phase.assigned === undefined && (phase.candidates === undefined || !Array.isArray(phase.candidates) || phase.candidates.length === 0)) {
        throw new Error('You must provide either "assigned" (number) or "candidates" (array of numbers) for each phase.');
      }

      PhaseSchema.parse(phase);

      // Create the main surgery_phase_requirement
      const created = await prisma.surgery_phase_requirements.create({
        data: {
          organization_id,
          operation_id,
          phase_id: phase.phase_id,
          required_count: phase.required_count,
          start_offset_min: phase.start_offset_min,
          end_offset_min: phase.end_offset_min
        }
      });

      if (phase.assigned !== undefined) {
        await prisma.surgery_phase_assigned_resources.create({
          data: {
            phase_requirement_id: created.id,
            resource_id: phase.assigned
          }
        });
      } else if (Array.isArray(phase.candidates) && phase.candidates.length > 0) {
        await prisma.surgery_phase_candidate_resources.createMany({
          data: phase.candidates.map((resource_id: number) => ({
            phase_requirement_id: created.id,
            resource_id
          }))
        });
      }

      ids.push(created.id);
    }

    await logActivityDirect(req, 'CREATE', 'surgery_phase_requirements');
    return {
      organization_id,
      operation_id,
      phase_requirement_ids: ids
    };
  }

  static async update(id: number, data: any, req: Request) {
    // Remove assigned/candidates from main update data
    const { assigned, candidates, ...updateFields } = data;
    const parsed = PhaseSchema.parse(updateFields);
    const updated = await prisma.surgery_phase_requirements.update({ where: { id }, data: parsed });

    // Update assigned resource
    if (assigned !== undefined) {
      // Upsert: if exists, update; else, create
      const existing = await prisma.surgery_phase_assigned_resources.findUnique({
        where: { phase_requirement_id: id }
      });
      if (existing) {
        await prisma.surgery_phase_assigned_resources.update({
          where: { phase_requirement_id: id },
          data: { resource_id: assigned }
        });
      } else {
        await prisma.surgery_phase_assigned_resources.create({
          data: { phase_requirement_id: id, resource_id: assigned }
        });
      }
    }

    // Update candidate resources
    if (Array.isArray(candidates)) {
      // Remove old candidates and insert new ones
      await prisma.surgery_phase_candidate_resources.deleteMany({
        where: { phase_requirement_id: id }
      });
      if (candidates.length > 0) {
        await prisma.surgery_phase_candidate_resources.createMany({
          data: candidates.map((resource_id: number) => ({
            phase_requirement_id: id,
            resource_id
          }))
        });
      }
    }

    await logActivityDirect(req, 'UPDATE', 'surgery_phase_requirements');
    return updated;
  }

  static async delete(id: number, req: Request) {
    const deleted = await prisma.surgery_phase_requirements.delete({ where: { id } });
    await logActivityDirect(req, 'DELETE', 'surgery_phase_requirements');
    return deleted;
  }
}