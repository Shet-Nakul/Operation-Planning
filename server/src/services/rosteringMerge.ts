import type { Prisma } from '@prisma/client';

type JsonMap = { [key: string]: Prisma.JsonValue };
type RosterViews = { employee_centric: Prisma.JsonValue; pool_centric: Prisma.JsonValue; date_centric: Prisma.JsonValue };

function object(value: Prisma.JsonValue | undefined): JsonMap {
  const result: JsonMap = {};
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, entry] of Object.entries(value)) {
      if (entry !== undefined) result[key] = entry;
    }
  }
  return result;
}

export function mergeRosteringViews(existing: RosterViews, incoming: RosterViews, poolIds: string[]) {
  const dates = new Set(Object.values(object(incoming.employee_centric)).flatMap(assignments => Object.keys(object(assignments))));
  const pools = { ...object(existing.pool_centric) };
  const byDate = { ...object(existing.date_centric) };
  for (const poolId of poolIds) {
    const days = { ...object(pools[poolId]) };
    dates.forEach(date => { delete days[date]; });
    pools[poolId] = days;
  }
  for (const date of dates) {
    const assignments = { ...object(byDate[date]) };
    poolIds.forEach(poolId => { delete assignments[poolId]; });
    byDate[date] = assignments;
  }
  const merge = (previous: Prisma.JsonValue, next: Prisma.JsonValue): JsonMap => {
    const result = { ...object(previous) };
    for (const [key, values] of Object.entries(object(next))) {
      result[key] = { ...object(result[key]), ...object(values) };
    }
    return result;
  };
  return {
    employee_centric: merge(existing.employee_centric, incoming.employee_centric),
    pool_centric: merge(pools, incoming.pool_centric),
    date_centric: merge(byDate, incoming.date_centric),
  };
}
