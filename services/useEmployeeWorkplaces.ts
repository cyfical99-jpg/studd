import { useEffect, useState } from 'react';

import * as workplacesRepo from '@/services/repositories/workplacesRepo';
import type { Employment, Workplace } from '@/services/types';

/** Loads this employee's employments + the workplaces they belong to, and
 * exposes a lookup so screens can show a name instead of an id. */
export function useEmployeeWorkplaces(userId: string | undefined) {
  const [employments, setEmployments] = useState<Employment[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    workplacesRepo.getEmploymentsForUser(userId).then(async (emps) => {
      if (cancelled) return;
      setEmployments(emps);
      const wps = await Promise.all(emps.map((e) => workplacesRepo.getWorkplaceById(e.workplaceId)));
      if (cancelled) return;
      setWorkplaces(wps.filter((w): w is Workplace => !!w));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  function workplaceName(workplaceId: string): string {
    return workplaces.find((w) => w.id === workplaceId)?.name ?? 'Workplace';
  }

  return { employments, workplaces, workplaceName, loading, workplaceIds: workplaces.map((w) => w.id) };
}
