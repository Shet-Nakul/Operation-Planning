import prisma from '../models/prisma';

export class PhaseRequirementsService {
  async list(params: { organizationId?: number; search?: string }) {
    return prisma.phase_requirements.findMany({
      where: {
        ...(params.organizationId ? { organization_id: params.organizationId } : {}),
        ...(params.search ? { name: { contains: params.search, mode: 'insensitive' } as any } : {})
      },
      orderBy: { name: 'asc' }
    });
  }

  async get(id: number) {
    return prisma.phase_requirements.findUnique({ where: { id } });
  }

  async create(data: any, actor: any, ip: string, userAgent: string) {
    const phase = await prisma.phase_requirements.create({ data: { ...data, created_by: actor.id } });
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: phase.organization_id,
        action_type: 'CREATE_PHASE_REQUIREMENT',
        entity_type: 'PHASE',
        entity_id: String(phase.id),
        description: 'Phase requirement created',
        metadata: data,
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return phase;
  }

  async update(id: number, data: any, actor: any, ip: string, userAgent: string) {
    const before = await prisma.phase_requirements.findUnique({ where: { id } });
    const phase = await prisma.phase_requirements.update({ where: { id }, data: { ...data, updated_by: actor.id } });
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: phase.organization_id,
        action_type: 'UPDATE_PHASE_REQUIREMENT',
        entity_type: 'PHASE',
        entity_id: String(phase.id),
        description: 'Phase requirement updated',
        metadata: { before, after: phase },
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return phase;
  }

  async delete(id: number, actor: any, ip: string, userAgent: string) {
    const phase = await prisma.phase_requirements.delete({ where: { id } });
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: phase.organization_id,
        action_type: 'DELETE_PHASE_REQUIREMENT',
        entity_type: 'PHASE',
        entity_id: String(id),
        description: 'Phase requirement deleted',
        metadata: phase ?? {},
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return phase;
  }
}
