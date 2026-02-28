import prisma from '../models/prisma';

export class OperationsService {
  async list(params: { organizationId?: number; skip?: number; take?: number; search?: string; status?: string }) {
    return prisma.operations.findMany({
      where: {
        ...(params.organizationId ? { organization_id: params.organizationId } : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.search ? { operation_code: { contains: params.search, mode: 'insensitive' } as any } : {})
      },
      skip: params.skip,
      take: params.take,
      orderBy: { created_at: 'desc' }
    });
  }

  async get(id: number) {
    // Fetch operation and include related OperationType, InfectionType, and SurgeryPhaseRequirements (ids only)
    const operation = await prisma.operations.findUnique({
      where: { id },
      include: {
        operationType: { select: { id: true, name: true } },
        infectionType: { select: { id: true, name: true } },
        surgery_phase_requirements: { select: { id: true } }
      }
    });

    if (!operation) return null;

    return {
      ...operation,
      operation_type: operation.operationType
        ? { id: operation.operationType.id, name: operation.operationType.name }
        : null,
      infection_type: operation.infectionType
        ? { id: operation.infectionType.id, name: operation.infectionType.name }
        : null,
      surgery_phase_requirements: operation.surgery_phase_requirements.map((spr: any) => spr.id)
    };
  }

  async create(data: any, actor: any, ip: string, userAgent: string) {
    // Validate earliest_day <= latest_day
    if (new Date(data.earliest_day) > new Date(data.latest_day)) throw new Error('earliest_day must be <= latest_day');
    let operation: any = undefined;
    await prisma.$transaction(async (tx) => {
      operation = await tx.operations.create({
        data: {
          ...data,
          earliest_day: new Date(data.earliest_day),
          latest_day: new Date(data.latest_day),
          created_by: actor.id
        }
      });
      if (data.surgery_phase_requirements && Array.isArray(data.surgery_phase_requirements)) {
        for (const phase of data.surgery_phase_requirements) {
          const spr = await tx.surgery_phase_requirements.create({
            data: { ...phase, operation_id: operation.id, organization_id: operation.organization_id }
          });
          if (phase.assigned_resources) {
            for (const ar of phase.assigned_resources) {
              await tx.surgery_phase_assigned_resources.create({
                data: { ...ar, phase_requirement_id: spr.id }
              });
            }
          }
          if (phase.candidate_resources) {
            for (const cr of phase.candidate_resources) {
              await tx.surgery_phase_candidate_resources.create({
                data: { ...cr, phase_requirement_id: spr.id }
              });
            }
          }
        }
      }
    });
    if (!operation) throw new Error('Operation creation failed');
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: data.organization_id,
        action_type: 'CREATE_OPERATION',
        entity_type: 'OPERATION',
        entity_id: String(operation.id),
        description: 'Operation created',
        metadata: data,
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return operation;
  }

  async update(id: number, data: any, actor: any, ip: string, userAgent: string) {
    if (data.earliest_day && data.latest_day && new Date(data.earliest_day) > new Date(data.latest_day)) throw new Error('earliest_day must be <= latest_day');
    const before = await prisma.operations.findUnique({ where: { id } });
    const operation = await prisma.operations.update({
      where: { id },
      data: {
        ...data,
        ...(data.earliest_day && { earliest_day: new Date(data.earliest_day) }),
        ...(data.latest_day && { latest_day: new Date(data.latest_day) }),
        updated_by: actor.id
      }
    });
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: operation.organization_id,
        action_type: 'UPDATE_OPERATION',
        entity_type: 'OPERATION',
        entity_id: String(operation.id),
        description: 'Operation updated',
        metadata: { before, after: operation },
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return operation;
  }

  async delete(id: number, actor: any, ip: string, userAgent: string) {
    const operation = await prisma.operations.delete({ where: { id } });
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: operation.organization_id,
        action_type: 'DELETE_OPERATION',
        entity_type: 'OPERATION',
        entity_id: String(id),
        description: 'Operation deleted',
        metadata: operation ?? {},
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return operation;
  }
}
