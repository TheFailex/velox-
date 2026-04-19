import { FlatList, View, Text, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated from 'react-native-reanimated';
import { TripCard } from '@/components/trip/TripCard';
import { LoadingState } from '@/components/shared/LoadingState';
import { tripsService } from '@/services/supabase';
import { useSubscription } from '@/hooks/useSubscription';
import { useTabEntrance } from '@/hooks/useTabEntrance';
import type { Trip } from '@/types';

const FREE_TRIP_LIMIT = 1;

export default function HistoryScreen() {
  const entranceStyle = useTabEntrance(1);
  const { isPremium } = useSubscription();
  const { data: trips = [], isLoading, isError, isFetching, refetch } = useQuery<Trip[]>({
    queryKey: ['trips'],
    queryFn: () => tripsService.list() as Promise<Trip[]>,
    retry: 1,
  });

  const visibleTrips = isPremium ? trips : trips.slice(0, FREE_TRIP_LIMIT);
  const lockedCount = trips.length - visibleTrips.length;

  if (isLoading) return <LoadingState />;

  if (isError) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
      </View>
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>⚠️</Text>
        <Text style={styles.emptyTitle}>Could not load trips</Text>
        <Text style={styles.emptySub}>Check your connection and Supabase configuration.</Text>
        <Pressable onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: '#0A0A0F' }, entranceStyle]}>
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        {trips.length > 0 && (
          <Text style={styles.headerSub}>
            {trips.length} {trips.length === 1 ? 'trip' : 'trips'}
          </Text>
        )}
      </View>

      <FlatList
        data={visibleTrips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          <TripCard
            trip={item}
            onPress={() => router.push(`/trip/${item.id}`)}
          />
        }
        contentContainerStyle={visibleTrips.length === 0 && lockedCount === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor="#00C896"
            colors={['#00C896']}
          />
        }
        ListEmptyComponent={<EmptyState />}
        ListFooterComponent={lockedCount > 0 ? <UpgradeBanner lockedCount={lockedCount} /> : null}
      />
    </SafeAreaView>
    </Animated.View>
  );
}

function UpgradeBanner({ lockedCount }: { lockedCount: number }) {
  return (
    <Pressable style={styles.upgradeBanner} onPress={() => router.push('/paywall')}>
      <Text style={styles.upgradeLock}>🔒</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.upgradeTitle}>
          {lockedCount} more {lockedCount === 1 ? 'trip' : 'trips'} locked
        </Text>
        <Text style={styles.upgradeSub}>Upgrade to Premium to unlock your full history</Text>
      </View>
      <Text style={styles.upgradeArrow}>›</Text>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>🚗</Text>
      <Text style={styles.emptyTitle}>No trips yet</Text>
      <Text style={styles.emptySub}>
        Head to the Dashboard and start your first trip.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSub: {
    color: '#8E8EA0',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 112,
  },
  emptyContainer: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  emptySub: {
    color: '#8E8EA0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#00C896',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: { color: '#0A0A0F', fontWeight: '700', fontSize: 15 },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#14141C',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,200,150,0.25)',
  },
  upgradeLock: { fontSize: 22 },
  upgradeTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  upgradeSub: { color: '#8E8EA0', fontSize: 12, marginTop: 2 },
  upgradeArrow: { color: '#00C896', fontSize: 22, fontWeight: '300' },
});
