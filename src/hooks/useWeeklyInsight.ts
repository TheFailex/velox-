import { useQuery } from '@tanstack/react-query';
import { weeklyInsightsService } from '@/services/supabase';

export function useWeeklyInsight() {
  const { data: insight, isLoading } = useQuery({
    queryKey: ['weekly-insight'],
    queryFn: () => weeklyInsightsService.getLatest(),
    staleTime: 1000 * 60 * 60, // 1 hour — insight changes at most weekly
  });

  return { insight: insight ?? null, isLoading };
}
