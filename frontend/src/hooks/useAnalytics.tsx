import { useMemo } from 'react';

export function useAnalytics(earningsData: any[]) {
  const summary = useMemo(() => {
    const total = earningsData?.reduce((s: number, d: any) => s + (d.revenue || 0), 0) || 0;
    return { total };
  }, [earningsData]);

  return { summary };
}
