import prisma from '../models/prisma';

// Keeps the legacy `department` string column in sync with the linked Department's name.
export async function resolveDepartmentName(departmentId?: number | null): Promise<string | null> {
  if (!departmentId) return null;
  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  return department?.name ?? null;
}
