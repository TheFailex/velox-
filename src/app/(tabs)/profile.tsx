import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSubscription } from '@/hooks/useSubscription';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/services/supabase';
import Constants from 'expo-constants';

const VEHICLE_TYPES = ['Car', 'Motorcycle', 'Truck', 'Van'] as const;

export default function ProfileScreen() {
  const { isPremium, openPaywall } = useSubscription();
  const { vehicleName, vehicleType, isSaving, updateProfile } = useProfile();

  const [editVisible, setEditVisible] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftType, setDraftType] = useState('Car');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const openEdit = () => {
    setDraftName(vehicleName ?? '');
    setDraftType(vehicleType);
    setEditVisible(true);
  };

  const saveEdit = async () => {
    try {
      await updateProfile({ vehicle_name: draftName || null, vehicle_type: draftType });
      setEditVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to save vehicle info. Please try again.');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/onboarding');
        },
      },
    ]);
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Identity card */}
        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={styles.identityInfo}>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email ?? 'Not signed in'}
            </Text>
            <View style={[styles.planBadge, isPremium && styles.planBadgePremium]}>
              <Text style={[styles.planBadgeText, isPremium && styles.planBadgeTextPremium]}>
                {isPremium ? '✦ PREMIUM' : 'FREE'}
              </Text>
            </View>
          </View>
        </View>

        {/* Upgrade CTA */}
        {!isPremium && (
          <Pressable style={styles.upgradeBtn} onPress={openPaywall}>
            <Text style={styles.upgradeBtnText}>✦  Upgrade to Premium</Text>
            <Text style={styles.upgradeBtnSub}>Insights, unlimited history & more</Text>
          </Pressable>
        )}

        {/* Vehicle section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vehicle</Text>
            <Pressable onPress={openEdit} hitSlop={8}>
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Name</Text>
            <Text style={styles.rowValue}>{vehicleName || 'Not set'}</Text>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>Type</Text>
            <Text style={styles.rowValue}>{vehicleType}</Text>
          </View>
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Pressable style={[styles.row, styles.rowLast]} onPress={handleSignOut}>
            <Text style={[styles.rowLabel, styles.danger]}>Sign Out</Text>
          </Pressable>
        </View>

        <Text style={styles.version}>Velox v{version}</Text>
      </ScrollView>

    {/* Vehicle edit modal */}
      <Modal visible={editVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Edit Vehicle</Text>

            <Text style={styles.modalLabel}>Nickname (optional)</Text>
            <TextInput
              style={styles.modalInput}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="e.g. Black Golf GTI"
              placeholderTextColor="#3A3A4A"
              maxLength={40}
            />

            <Text style={styles.modalLabel}>Type</Text>
            <View style={styles.typeRow}>
              {VEHICLE_TYPES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setDraftType(t)}
                  style={[styles.typeChip, draftType === t && styles.typeChipSelected]}
                >
                  <Text style={[styles.typeChipText, draftType === t && styles.typeChipTextSelected]}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
              onPress={saveEdit}
              disabled={isSaving}
            >
              <Text style={styles.saveBtnText}>{isSaving ? 'Saving…' : 'Save'}</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={() => setEditVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: '#14141C',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,200,150,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,200,150,0.3)',
  },
  avatarText: { color: '#00C896', fontSize: 20, fontWeight: '700' },
  identityInfo: { flex: 1, gap: 6 },
  email: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  planBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  planBadgePremium: {
    backgroundColor: 'rgba(0,200,150,0.12)',
    borderColor: 'rgba(0,200,150,0.3)',
  },
  planBadgeText: { color: '#8E8EA0', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  planBadgeTextPremium: { color: '#00C896' },
  upgradeBtn: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: 'rgba(0,200,150,0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,200,150,0.25)',
  },
  upgradeBtnText: { color: '#00C896', fontSize: 16, fontWeight: '700', marginBottom: 2 },
  upgradeBtnSub: { color: '#8E8EA0', fontSize: 13 },
  section: {
    marginHorizontal: 20,
    backgroundColor: '#14141C',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  sectionTitle: {
    color: '#8E8EA0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  editLink: { color: '#00C896', fontSize: 13, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  rowLast: {},
  rowLabel: { color: '#FFFFFF', fontSize: 15 },
  rowValue: { color: '#8E8EA0', fontSize: 15 },
  danger: { color: '#FF4B4B' },
  version: {
    color: '#3A3A4A',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 16,
    marginBottom: 80,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#14141C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  modalLabel: {
    color: '#8E8EA0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#0A0A0F',
    borderRadius: 12,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 20,
  },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 28, flexWrap: 'wrap' },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: '#0A0A0F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  typeChipSelected: { backgroundColor: 'rgba(0,200,150,0.12)', borderColor: '#00C896' },
  typeChipText: { color: '#8E8EA0', fontSize: 14 },
  typeChipTextSelected: { color: '#00C896', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#00C896',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#0A0A0F', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelBtnText: { color: '#8E8EA0', fontSize: 15 },
});
