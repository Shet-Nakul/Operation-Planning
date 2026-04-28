import prisma from '../models/prisma';

export async function createAuditLog(data: {
  action: string;
  entity: string;
  entity_id: string;
  user_id?: number;
  organization_id?: number;
  description?: string;
  metadata?: any;
}) {
  try {
    await prisma.userActivityLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        entity_id: data.entity_id,
        user_id: data.user_id,
        organization_id: data.organization_id,
        description: data.description,
        metadata: data.metadata || {},
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}
