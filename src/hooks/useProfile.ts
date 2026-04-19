import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profilesService } from '@/services/supabase';
import type { Profile } from '@/types';

type ProfileUpdate = Parameters<typeof profilesService.upsert>[0];

export function useProfile() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profilesService.get(),
  });

  const { mutateAsync: updateProfile, isPending: isSaving } = useMutation({
    mutationFn: (update: ProfileUpdate) => profilesService.upsert(update),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });

  return {
    vehicleName: profile?.vehicle_name ?? null,
    vehicleType: profile?.vehicle_type ?? 'Car',
    vehicleMake: profile?.vehicle_make ?? null,
    vehicleModel: profile?.vehicle_model ?? null,
    username: profile?.username ?? null,
    country: profile?.country ?? null,
    speedUnit: (profile?.speed_unit ?? 'kmh') as 'kmh' | 'mph',
    vehicles: profile?.vehicles ?? [],
    isLoading,
    isSaving,
    updateProfile,
  };
}
