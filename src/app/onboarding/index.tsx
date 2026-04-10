import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { locationService } from '@/services/location';
import { ONBOARDING_KEY } from '@/app/_layout';

const VEHICLE_TYPES = ['Car', 'Motorcycle', 'Truck', 'Van'] as const;

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleType, setVehicleType] = useState<string>('Car');

  const next = () => setStep((s) => s + 1);

  const handlePermissions = async () => {
    await locationService.requestPermissions();
    next(); // advance regardless — user can grant later from Profile
  };

  const handleFinish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    // TODO: save vehicleName + vehicleType to profiles table (Backend workspace)
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Progress dots */}
      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      {step === 0 && <StepWelcome onNext={next} />}
      {step === 1 && <StepPermissions onNext={handlePermissions} />}
      {step === 2 && (
        <StepVehicle
          vehicleName={vehicleName}
          setVehicleName={setVehicleName}
          vehicleType={vehicleType}
          setVehicleType={setVehicleType}
          onFinish={handleFinish}
        />
      )}
    </SafeAreaView>
  );
}

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.step}>
      <View style={styles.illustration}>
        <Text style={styles.illustrationIcon}>🏎</Text>
      </View>
      <Text style={styles.title}>Meet Velox.</Text>
      <Text style={styles.subtitle}>Your personal driving analyst.</Text>
      <Text style={styles.body}>
        Track every trip, analyze your speed, and get weekly AI insights — built for drivers who
        geek out on their car's performance.
      </Text>
      <Pressable style={styles.primaryBtn} onPress={onNext}>
        <Text style={styles.primaryBtnText}>Get Started</Text>
      </Pressable>
    </View>
  );
}

function StepPermissions({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.step}>
      <View style={styles.illustration}>
        <Text style={styles.illustrationIcon}>📍</Text>
      </View>
      <Text style={styles.title}>Background Location</Text>
      <Text style={styles.body}>
        Velox needs background location to track your trips accurately — even when the app is
        minimized.{'\n\n'}Your data is encrypted and <Text style={styles.accent}>never sold</Text>.
        We only use your location to compute trip stats.
      </Text>
      <Pressable style={styles.primaryBtn} onPress={onNext}>
        <Text style={styles.primaryBtnText}>Allow Location Access</Text>
      </Pressable>
      <Pressable onPress={onNext} hitSlop={8} style={styles.skipBtn}>
        <Text style={styles.skipText}>Skip for now</Text>
      </Pressable>
    </View>
  );
}

function StepVehicle({
  vehicleName,
  setVehicleName,
  vehicleType,
  setVehicleType,
  onFinish,
}: {
  vehicleName: string;
  setVehicleName: (v: string) => void;
  vehicleType: string;
  setVehicleType: (v: string) => void;
  onFinish: () => void;
}) {
  return (
    <KeyboardAvoidingView
      style={styles.step}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.illustration}>
        <Text style={styles.illustrationIcon}>🚗</Text>
      </View>
      <Text style={styles.title}>Your Car</Text>
      <Text style={styles.body}>Give your vehicle a nickname — optional, but makes insights personal.</Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. Black Golf GTI"
        placeholderTextColor="#3A3A4A"
        value={vehicleName}
        onChangeText={setVehicleName}
        maxLength={40}
      />

      <View style={styles.typeRow}>
        {VEHICLE_TYPES.map((t) => (
          <Pressable
            key={t}
            onPress={() => setVehicleType(t)}
            style={[styles.typeChip, vehicleType === t && styles.typeChipSelected]}
          >
            <Text style={[styles.typeChipText, vehicleType === t && styles.typeChipTextSelected]}>
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.primaryBtn} onPress={onFinish}>
        <Text style={styles.primaryBtnText}>Let's Go</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
    paddingBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2A2A3A',
  },
  dotActive: {
    backgroundColor: '#00C896',
    width: 20,
    borderRadius: 3,
  },
  step: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 16,
    justifyContent: 'center',
  },
  illustration: {
    alignItems: 'center',
    marginBottom: 32,
  },
  illustrationIcon: { fontSize: 80 },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: '#00C896',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  body: {
    color: '#8E8EA0',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 40,
  },
  accent: { color: '#00C896', fontWeight: '600' },
  primaryBtn: {
    backgroundColor: '#00C896',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: { color: '#0A0A0F', fontSize: 17, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { color: '#8E8EA0', fontSize: 14 },
  input: {
    backgroundColor: '#14141C',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 40, flexWrap: 'wrap' },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: '#14141C',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  typeChipSelected: {
    backgroundColor: 'rgba(0,200,150,0.12)',
    borderColor: '#00C896',
  },
  typeChipText: { color: '#8E8EA0', fontSize: 14 },
  typeChipTextSelected: { color: '#00C896', fontWeight: '600' },
});
