import prisma from '../models/prisma';

export class OperationTypesService {
  async list(params: { organizationId?: number; search?: string }) {
    return prisma.operation_types.findMany({
      where: {
        ...(params.organizationId ? { organization_id: params.organizationId } : {}),
        ...(params.search ? { name: { contains: params.search, mode: 'insensitive' } as any } : {})
      },
      orderBy: { name: 'asc' }
    });
  }

  async get(id: number) {
    return prisma.operation_types.findUnique({ where: { id } });
  }

  async create(data: any, actor: any, ip: string, userAgent: string) {
    const opType = await prisma.operation_types.create({ data: { ...data, created_by: actor.id } });
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: opType.organization_id,
        action_type: 'CREATE_OPERATION_TYPE',
        entity_type: 'OPERATION_TYPE',
        entity_id: String(opType.id),
        description: 'Operation type created',
        metadata: data,
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return opType;
  }

  async update(id: number, data: any, actor: any, ip: string, userAgent: string) {
    const before = await prisma.operation_types.findUnique({ where: { id } });
    const opType = await prisma.operation_types.update({ where: { id }, data: { ...data, updated_by: actor.id } });
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: opType.organization_id,
        action_type: 'UPDATE_OPERATION_TYPE',
        entity_type: 'OPERATION_TYPE',
        entity_id: String(opType.id),
        description: 'Operation type updated',
        metadata: { before, after: opType },
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return opType;
  }

  async delete(id: number, actor: any, ip: string, userAgent: string) {
    const opType = await prisma.operation_types.delete({ where: { id } });
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: opType.organization_id,
        action_type: 'DELETE_OPERATION_TYPE',
        entity_type: 'OPERATION_TYPE',
        entity_id: String(id),
        description: 'Operation type deleted',
        metadata: opType ?? {},
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return opType;
  }
}
