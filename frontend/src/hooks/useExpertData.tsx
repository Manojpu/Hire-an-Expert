import { useState, useEffect } from 'react';
import { mockExpertData } from '@/data/mockExpertData';

export function useExpertData() {
  const [expertData, setExpertData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 300));
      setExpertData(mockExpertData);
      setLoading(false);
    };
    load();
  }, []);

  const updateExpertProfile = async (patch: any) => {
    setExpertData((prev: any) => ({ ...prev, expert: { ...prev.expert, ...patch } }));
    return true;
  };

  return { expertData, loading, updateExpertProfile };
}
