import { useEffect, useState } from 'react';

import * as workplacesRepo from '@/services/repositories/workplacesRepo';
import type { Workplace } from '@/services/types';

/** A manager can run multiple workplaces; this pass keeps things simple by
 * always operating on their first one (no workplace switcher UI yet). */
export function useManagerWorkplace(managerId: string | undefined) {
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!managerId) return;
    workplacesRepo.getWorkplacesForManager(managerId).then((w) => {
      setWorkplaces(w);
      setLoading(false);
    });
  }, [managerId]);

  return { workplace: workplaces[0], workplaces, loading };
}
