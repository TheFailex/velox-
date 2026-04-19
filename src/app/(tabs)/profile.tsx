import { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Alert, TextInput,
  Modal, ScrollView, FlatList, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '@/hooks/useSubscription';
import { useProfile } from '@/hooks/useProfile';
import { useTabEntrance } from '@/hooks/useTabEntrance';
import { supabase } from '@/services/supabase';
import { MAKE_NAMES, getModelsForMake, MOTORBIKE_MAKE_NAMES, getMotorbikeModelsForMake } from '@/data/vehicles';
import type { VehicleEntry } from '@/types';
import Constants from 'expo-constants';

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Argentina','Australia','Austria','Belgium',
  'Bolivia','Brazil','Bulgaria','Canada','Chile','China','Colombia','Croatia',
  'Czech Republic','Denmark','Dominican Republic','Ecuador','Egypt','Estonia',
  'Finland','France','Germany','Greece','Guatemala','Honduras','Hungary',
  'India','Indonesia','Ireland','Israel','Italy','Japan','Jordan','Kazakhstan',
  'Latvia','Lithuania','Luxembourg','Malaysia','Mexico','Morocco','Netherlands',
  'New Zealand','Nigeria','Norway','Pakistan','Panama','Paraguay','Peru',
  'Philippines','Poland','Portugal','Romania','Russia','Saudi Arabia','Serbia',
  'Singapore','Slovakia','Slovenia','South Africa','South Korea','Spain',
  'Sweden','Switzerland','Taiwan','Thailand','Turkey','Ukraine',
  'United Arab Emirates','United Kingdom','United States','Uruguay','Venezuela','Vietnam',
];

const EMPTY_VEHICLE: VehicleEntry = { type: 'Car', make: '', model: '' };

export default function ProfileScreen() {
  const entranceStyle = useTabEntrance(3);
  const { isPremium, openPaywall } = useSubscription();
  const {
    vehicleType, vehicleMake, vehicleModel, username,
    country, speedUnit, vehicles, isSaving, updateProfile,
  } = useProfile();

  const [editVisible, setEditVisible] = useState(false);

  // Draft state
  const [draftVehicles, setDraftVehicles] = useState<VehicleEntry[]>([EMPTY_VEHICLE]);
  const [draftUsername, setDraftUsername] = useState('');
  const [draftCountry, setDraftCountry] = useState('');
  const [draftUnit, setDraftUnit] = useState<'kmh' | 'mph'>('kmh');

  // Active picker: which vehicle index + make or model
  const [activePicker, setActivePicker] = useState<{ idx: number; kind: 'make' | 'model' } | null>(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const openEdit = () => {
    // Load existing vehicles or build from primary fields
    const existing: VehicleEntry[] = vehicles && vehicles.length > 0
      ? vehicles
      : [{
          type: (vehicleType === 'Motorbike' ? 'Motorbike' : 'Car') as VehicleEntry['type'],
          make: vehicleMake ?? '',
          model: vehicleModel ?? '',
        }];
    setDraftVehicles(existing);
    setDraftUsername(username ?? '');
    setDraftCountry(country ?? '');
    setDraftUnit(speedUnit);
    setEditVisible(true);
  };

  const saveEdit = async () => {
    const clean = draftVehicles.map((v) => ({
      type: v.type,
      make: v.make.trim(),
      model: v.model.trim(),
    }));
    try {
      await updateProfile({
        vehicle_type: clean[0]?.type ?? 'Car',
        vehicle_make: clean[0]?.make || null,
        vehicle_model: clean[0]?.model || null,
        vehicles: clean,
        // Never overwrite an existing username
        username: username ?? (draftUsername.trim() || null),
        country: draftCountry || null,
        speed_unit: draftUnit,
      });
      setEditVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
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

  // Helpers for active picker
  const updateVehicle = (idx: number, patch: Partial<VehicleEntry>) => {
    setDraftVehicles((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, ...patch } : v))
    );
  };

  const addVehicle = () => {
    if (draftVehicles.length < 10) {
      setDraftVehicles((prev) => [...prev, { ...EMPTY_VEHICLE }]);
    }
  };

  const removeVehicle = (idx: number) => {
    if (draftVehicles.length <= 1) return;
    setDraftVehicles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Picker items based on active picker context
  const activeVehicle = activePicker !== null ? draftVehicles[activePicker.idx] : null;
  const makeNames = activeVehicle?.type === 'Motorbike' ? MOTORBIKE_MAKE_NAMES : MAKE_NAMES;
  const pickerItems = activePicker?.kind === 'make'
    ? makeNames.filter((m) => m.toLowerCase().includes(pickerSearch.toLowerCase()))
    : (activeVehicle?.type === 'Motorbike'
        ? getMotorbikeModelsForMake(activeVehicle?.make ?? '')
        : getModelsForMake(activeVehicle?.make ?? '')
      ).filter((m) => m.toLowerCase().includes(pickerSearch.toLowerCase()));

  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const primaryVehicle = vehicles?.[0];

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: '#0A0A0F' }, entranceStyle]}>
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 112 }}>
        {/* Identity card */}
        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={styles.identityInfo}>
            {username ? <Text style={styles.username}>@{username}</Text> : null}
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

        {!isPremium && (
          <Pressable style={styles.upgradeBtn} onPress={openPaywall}>
            <Text style={styles.upgradeBtnText}>✦  Upgrade to Premium</Text>
            <Text style={styles.upgradeBtnSub}>Insights, unlimited history & more</Text>
          </Pressable>
        )}

        {/* Vehicles section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {(vehicles?.length ?? 0) > 1 ? 'Vehicles' : 'Vehicle'}
            </Text>
            <Pressable onPress={openEdit} hitSlop={8}>
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          </View>
          {(vehicles && vehicles.length > 0 ? vehicles : [{ type: vehicleType, make: vehicleMake, model: vehicleModel }]).map((v: any, idx: number) => (
            <View key={idx}>
              {vehicles && vehicles.length > 1 && (
                <Text style={styles.vehicleIndexLabel}>Vehicle {idx + 1}</Text>
              )}
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Type</Text>
                <Text style={styles.rowValue}>
                  {v.type === 'Motorbike' ? '🏍️ Motorbike' : '🚗 Car'}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Make</Text>
                <Text style={styles.rowValue}>{v.make || 'Not set'}</Text>
              </View>
              <View style={[styles.row, idx === (vehicles?.length ?? 1) - 1 && styles.rowLast]}>
                <Text style={styles.rowLabel}>Model</Text>
                <Text style={styles.rowValue}>{v.model || 'Not set'}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <Pressable onPress={openEdit} hitSlop={8}>
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Speed unit</Text>
            <Text style={styles.rowValue}>{speedUnit === 'mph' ? 'mph' : 'km/h'}</Text>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>Country</Text>
            <Text style={styles.rowValue}>{country || 'Not set'}</Text>
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }]}>Account</Text>
          <Pressable style={[styles.row, styles.rowLast]} onPress={handleSignOut}>
            <Text style={[styles.rowLabel, styles.danger]}>Sign Out</Text>
          </Pressable>
        </View>

        <Text style={styles.version}>Velox v{version}</Text>
      </ScrollView>

      {/* ── Edit sheet ─────────────────────────────────────────────────────── */}
      <Modal visible={editVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.sheetContainer} edges={['top', 'bottom']}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Edit Profile</Text>
            <Pressable onPress={() => setEditVisible(false)} hitSlop={12}>
              <Ionicons name="close" size={24} color="#8E8EA0" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* ── Vehicle entries ─────────────────────────────────────────── */}
            {draftVehicles.map((vehicle, idx) => (
              <View key={idx}>
                <View style={styles.vehicleEntryHeader}>
                  <Text style={styles.fieldLabel}>
                    {draftVehicles.length > 1 ? `Vehicle ${idx + 1}` : 'Vehicle'}
                  </Text>
                  {draftVehicles.length > 1 && (
                    <Pressable onPress={() => removeVehicle(idx)} hitSlop={8} style={styles.removeVehicleBtn}>
                      <Ionicons name="trash-outline" size={16} color="#FF4B4B" />
                    </Pressable>
                  )}
                </View>

                {/* Type */}
                <View style={styles.categoryRow}>
                  {(['Car', 'Motorbike'] as const).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      activeOpacity={0.7}
                      onPress={() => updateVehicle(idx, { type: cat, make: '', model: '' })}
                      style={[styles.categoryCard, vehicle.type === cat && styles.categoryCardSelected]}
                    >
                      <Text style={styles.categoryIcon}>{cat === 'Car' ? '🚗' : '🏍️'}</Text>
                      <Text style={[styles.categoryLabel, vehicle.type === cat && styles.categoryLabelSelected]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Make */}
                <Text style={styles.subFieldLabel}>Make</Text>
                <Pressable
                  style={styles.dropdownBtn}
                  onPress={() => { setPickerSearch(''); setActivePicker({ idx, kind: 'make' }); }}
                >
                  <Text style={[styles.dropdownText, !vehicle.make && styles.dropdownPlaceholder]}>
                    {vehicle.make || 'Select Make'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#8E8EA0" />
                </Pressable>

                {/* Model */}
                <Text style={styles.subFieldLabel}>Model</Text>
                <Pressable
                  style={[styles.dropdownBtn, !vehicle.make && styles.dropdownDisabled]}
                  onPress={() => {
                    if (!vehicle.make) return;
                    setPickerSearch('');
                    setActivePicker({ idx, kind: 'model' });
                  }}
                >
                  <Text style={[styles.dropdownText, !vehicle.model && styles.dropdownPlaceholder]}>
                    {vehicle.model || 'Select Model'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#8E8EA0" />
                </Pressable>

                {idx < draftVehicles.length - 1 && <View style={styles.vehicleDivider} />}
              </View>
            ))}

            {/* Add vehicle button — premium only */}
            {isPremium && draftVehicles.length < 10 && (
              <Pressable style={styles.addVehicleBtn} onPress={addVehicle}>
                <Ionicons name="add-circle-outline" size={18} color="#00C896" />
                <Text style={styles.addVehicleBtnText}>Add Another Vehicle</Text>
              </Pressable>
            )}
            {!isPremium && (
              <Pressable style={[styles.addVehicleBtn, styles.addVehicleBtnLocked]} onPress={openPaywall}>
                <Ionicons name="lock-closed-outline" size={16} color="#8E8EA0" />
                <Text style={styles.addVehicleBtnLockedText}>Multiple vehicles — Premium only</Text>
              </Pressable>
            )}

            {/* Username */}
            <Text style={styles.fieldLabel}>Username</Text>
            {username ? (
              <View style={styles.usernameLockedWrap}>
                <Text style={styles.usernameAt}>@</Text>
                <Text style={styles.usernameLockedText}>{username}</Text>
                <Ionicons name="lock-closed-outline" size={15} color="#3A3A4A" />
              </View>
            ) : (
              <View style={styles.usernameWrap}>
                <Text style={styles.usernameAt}>@</Text>
                <TextInput
                  style={styles.usernameInput}
                  value={draftUsername}
                  onChangeText={setDraftUsername}
                  placeholder="username"
                  placeholderTextColor="#3A3A4A"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                />
              </View>
            )}
            <Text style={styles.usernameCaption}>
              {username ? 'Username cannot be changed after it\'s set' : 'Choose carefully — this cannot be changed later'}
            </Text>

            {/* Country */}
            <Text style={styles.fieldLabel}>Country</Text>
            <Pressable style={styles.dropdownBtn} onPress={() => setShowCountryPicker(true)}>
              <Text style={[styles.dropdownText, !draftCountry && styles.dropdownPlaceholder]}>
                {draftCountry || 'Select Country'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#8E8EA0" />
            </Pressable>

            {/* Speed unit */}
            <Text style={styles.fieldLabel}>Speed Unit</Text>
            <View style={styles.unitToggleRow}>
              {(['kmh', 'mph'] as const).map((u) => (
                <Pressable
                  key={u}
                  onPress={() => setDraftUnit(u)}
                  style={[styles.unitBtn, draftUnit === u && styles.unitBtnActive]}
                >
                  <Text style={[styles.unitBtnText, draftUnit === u && styles.unitBtnTextActive]}>
                    {u === 'kmh' ? 'km/h' : 'mph'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={{ height: 24 }} />

            <Pressable
              style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
              onPress={saveEdit}
              disabled={isSaving}
            >
              <Text style={styles.saveBtnText}>{isSaving ? 'Saving…' : 'Save Changes'}</Text>
            </Pressable>

            <View style={{ height: 20 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Make / Model picker (shared for all vehicles) */}
      <PickerModal
        visible={activePicker !== null && activePicker.kind === 'make'}
        title="Select Make"
        items={pickerItems}
        search={pickerSearch}
        onSearch={setPickerSearch}
        onSelect={(v) => {
          if (activePicker) {
            updateVehicle(activePicker.idx, { make: v, model: '' });
          }
          setPickerSearch('');
          setActivePicker(null);
        }}
        onClose={() => { setPickerSearch(''); setActivePicker(null); }}
      />
      <PickerModal
        visible={activePicker !== null && activePicker.kind === 'model'}
        title="Select Model"
        items={pickerItems}
        search={pickerSearch}
        onSearch={setPickerSearch}
        onSelect={(v) => {
          if (activePicker) updateVehicle(activePicker.idx, { model: v });
          setPickerSearch('');
          setActivePicker(null);
        }}
        onClose={() => { setPickerSearch(''); setActivePicker(null); }}
      />

      {/* Country picker */}
      <PickerModal
        visible={showCountryPicker}
        title="Select Country"
        items={filteredCountries}
        search={countrySearch}
        onSearch={setCountrySearch}
        onSelect={(v) => { setDraftCountry(v); setCountrySearch(''); setShowCountryPicker(false); }}
        onClose={() => { setCountrySearch(''); setShowCountryPicker(false); }}
      />
    </SafeAreaView>
    </Animated.View>
  );
}

function PickerModal({
  visible, title, items, search, onSearch, onSelect, onClose,
}: {
  visible: boolean; title: string; items: string[];
  search: string; onSearch: (v: string) => void;
  onSelect: (v: string) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.pickerContainer} edges={['top', 'bottom']}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color="#8E8EA0" />
          </Pressable>
        </View>
        <View style={styles.pickerSearchWrap}>
          <Ionicons name="search" size={16} color="#8E8EA0" style={{ marginLeft: 12 }} />
          <TextInput
            style={styles.pickerSearch}
            placeholder="Search..."
            placeholderTextColor="#3A3A4A"
            value={search}
            onChangeText={onSearch}
            autoFocus
          />
        </View>
        <FlatList
          data={items}
          keyExtractor={(item) => item}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.pickerItem} onPress={() => onSelect(item)}>
              <Text style={styles.pickerItemText}>{item}</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.pickerSep} />}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  headerTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },

  identityCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, backgroundColor: '#14141C',
    borderRadius: 16, padding: 16, gap: 14, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(0,200,150,0.15)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,200,150,0.3)',
  },
  avatarText: { color: '#00C896', fontSize: 20, fontWeight: '700' },
  identityInfo: { flex: 1, gap: 4 },
  username: { color: '#00C896', fontSize: 14, fontWeight: '600' },
  email: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  planBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  planBadgePremium: { backgroundColor: 'rgba(0,200,150,0.12)', borderColor: 'rgba(0,200,150,0.3)' },
  planBadgeText: { color: '#8E8EA0', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  planBadgeTextPremium: { color: '#00C896' },

  upgradeBtn: {
    marginHorizontal: 20, marginBottom: 24,
    backgroundColor: 'rgba(0,200,150,0.08)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(0,200,150,0.25)',
  },
  upgradeBtnText: { color: '#00C896', fontSize: 16, fontWeight: '700', marginBottom: 2 },
  upgradeBtnSub: { color: '#8E8EA0', fontSize: 13 },

  section: {
    marginHorizontal: 20, backgroundColor: '#14141C', borderRadius: 16,
    marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
  },
  sectionTitle: {
    color: '#8E8EA0', fontSize: 11, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  editLink: { color: '#00C896', fontSize: 13, fontWeight: '600' },
  vehicleIndexLabel: {
    color: '#3A3A4A', fontSize: 11, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase',
    paddingHorizontal: 16, paddingTop: 10,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
  },
  rowLast: {},
  rowLabel: { color: '#FFFFFF', fontSize: 15 },
  rowValue: { color: '#8E8EA0', fontSize: 15 },
  danger: { color: '#FF4B4B' },

  version: { color: '#3A3A4A', fontSize: 12, textAlign: 'center', paddingVertical: 16 },

  // Edit sheet
  sheetContainer: { flex: 1, backgroundColor: '#0A0A0F' },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sheetTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },

  fieldLabel: {
    color: '#8E8EA0', fontSize: 11, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase',
    marginBottom: 8, marginTop: 20, marginHorizontal: 20,
  },
  subFieldLabel: {
    color: '#8E8EA0', fontSize: 11, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase',
    marginBottom: 8, marginTop: 14, marginHorizontal: 20,
  },

  vehicleEntryHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingRight: 20,
  },
  removeVehicleBtn: {
    paddingTop: 20, paddingLeft: 12,
  },
  vehicleDivider: {
    height: 1, backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 20, marginTop: 20,
  },

  addVehicleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 16, padding: 14,
    backgroundColor: 'rgba(0,200,150,0.08)',
    borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(0,200,150,0.25)',
    borderStyle: 'dashed',
  },
  addVehicleBtnText: { color: '#00C896', fontSize: 14, fontWeight: '600' },
  addVehicleBtnLocked: {
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  addVehicleBtnLockedText: { color: '#8E8EA0', fontSize: 14, fontWeight: '500' },

  categoryRow: { flexDirection: 'row', gap: 12, marginHorizontal: 20 },
  categoryCard: {
    flex: 1, backgroundColor: '#14141C', borderRadius: 14, padding: 16,
    alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
  },
  categoryCardSelected: { borderColor: '#00C896', backgroundColor: 'rgba(0,200,150,0.08)' },
  categoryIcon: { fontSize: 28, marginBottom: 6 },
  categoryLabel: { color: '#8E8EA0', fontSize: 14, fontWeight: '600' },
  categoryLabelSelected: { color: '#00C896' },

  dropdownBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 20, backgroundColor: '#14141C', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  dropdownDisabled: { opacity: 0.4 },
  dropdownText: { color: '#FFFFFF', fontSize: 16 },
  dropdownPlaceholder: { color: '#3A3A4A' },

  usernameWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, backgroundColor: '#14141C', borderRadius: 12,
    paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  usernameLockedWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, backgroundColor: '#14141C', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', opacity: 0.6,
  },
  usernameLockedText: { flex: 1, color: '#FFFFFF', fontSize: 16 },
  usernameCaption: {
    color: '#3A3A4A', fontSize: 11, marginHorizontal: 20, marginTop: 6,
  },
  usernameAt: { color: '#8E8EA0', fontSize: 16, fontWeight: '600', marginRight: 4 },
  usernameInput: { flex: 1, color: '#FFFFFF', fontSize: 16, paddingVertical: 14 },

  unitToggleRow: {
    flexDirection: 'row', marginHorizontal: 20,
    backgroundColor: '#14141C', borderRadius: 12,
    padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  unitBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  unitBtnActive: { backgroundColor: '#00C896' },
  unitBtnText: { color: '#8E8EA0', fontSize: 15, fontWeight: '600' },
  unitBtnTextActive: { color: '#0A0A0F' },

  saveBtn: {
    marginHorizontal: 20, backgroundColor: '#00C896',
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#0A0A0F', fontSize: 16, fontWeight: '700' },

  pickerContainer: { flex: 1, backgroundColor: '#0A0A0F' },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  pickerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  pickerSearchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#14141C', borderRadius: 12,
    margin: 16, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  pickerSearch: { flex: 1, color: '#FFFFFF', fontSize: 16, paddingHorizontal: 10, paddingVertical: 12 },
  pickerItem: { paddingHorizontal: 20, paddingVertical: 16 },
  pickerItemText: { color: '#FFFFFF', fontSize: 16 },
  pickerSep: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 20 },
});
