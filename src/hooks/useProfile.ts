import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profilesService } from '@/services/supabase';

export function useProfile() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profilesService.get(),
  });

  const { mutateAsync: updateProfile, isPending: isSaving } = useMutation({
    mutationFn: (update: { vehicle_name?: string | null; vehicle_type?: string }) =>
      profilesService.upsert(update),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });

  return {
    vehicleName: profile?.vehicle_name ?? null,
    vehicleType: profile?.vehicle_type ?? 'Car',
    isLoading,
    isSaving,
    updateProfile,
  };
}
