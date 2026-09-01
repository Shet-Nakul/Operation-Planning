import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../context/AppStoreContext';
import { getRenewableResourcePools } from '../lib/api';
import type { ResourceCatalog } from '../lib/resolveAssignedResource';

type NhPoolRow = ResourceCatalog['nhPools'][number];

let cachedNhPools: NhPoolRow[] | null = null;

export function useResourceCatalog(): ResourceCatalog {
  const { store } = useAppStore();
  const [nhPools, setNhPools] = useState<NhPoolRow[]>(cachedNhPools ?? []);

  useEffect(() => {
    let cancelled = false;
    getRenewableResourcePools({ orgId: 1 })
      .then((rows) => {
        const mapped: NhPoolRow[] = (Array.isArray(rows) ? rows : []).map((p: any) => ({
          pool_id: String(p.pool_id ?? ''),
          pool_name: String(p.pool_name ?? ''),
          resource_type: p.resource_type ? String(p.resource_type) : undefined,
          resources: Array.isArray(p.resources) ? p.resources.map((u: unknown) => String(u)) : [],
        }));
        cachedNhPools = mapped;
        if (!cancelled) setNhPools(mapped);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const hrPools = useMemo(() => {
    const nhIds = new Set(nhPools.map((p) => p.pool_id));
    return (store.resourcePools || [])
      .filter((p) => p.id && !nhIds.has(p.id))
      .map((p) => ({ id: p.id, name: p.name }));
  }, [store.resourcePools, nhPools]);

  return {
    staff: store.staff || [],
    hrPools,
    nhPools,
  };
}
