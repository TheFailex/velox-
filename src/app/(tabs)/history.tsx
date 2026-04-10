import { FlatList, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { TripCard } from '@/components/trip/TripCard';
import { LoadingState } from '@/components/shared/LoadingState';
import { tripsService } from '@/services/supabase';
import type { Trip } from '@/types';

export default function HistoryScreen() {
  const { data: trips = [], isLoading, isFetching, refetch } = useQuery<Trip[]>({
    queryKey: ['trips'],
    queryFn: () => tripsService.list() as Promise<Trip[]>,
  });

  if (isLoading) return <LoadingState />;

  return (
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
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          <TripCard
            trip={item}
            onPress={() => router.push(`/trip/${item.id}`)}
          />
        }
        contentContainerStyle={trips.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor="#00C896"
            colors={['#00C896']}
          />
        }
        ListEmptyComponent={<EmptyState />}
      />
    </SafeAreaView>
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
});
