import { useCallback, useEffect, useState } from 'react';

import { getAll, subscribe } from '@/services/localStore';

/**
 * Subscribes a component to a local-store collection: reloads whenever any
 * repository mutates it (anywhere in the app), so e.g. a manager approving
 * a release request live-updates the employee's screen in the same session.
 */
export function useCollection<T>(collection: string, seed: T[]): { data: T[]; loading: boolean; reload: () => void } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    getAll<T>(collection, seed).then((rows) => {
      setData(rows);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection]);

  useEffect(() => {
    load();
    return subscribe(collection, load);
  }, [collection, load]);

  return { data, loading, reload: load };
}
