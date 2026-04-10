import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { locationService } from '@/services/location';
import { supabase, profilesService } from '@/services/supabase';
import { ONBOARDING_KEY } from '@/app/_layout';

const VEHICLE_TYPES = ['Car', 'Motorcycle', 'Truck', 'Van'] as const;
const TOTAL_STEPS = 5;

// Steps: 0=Welcome, 1=Auth, 2=Location, 3=Vehicle, 4=Done→paywall

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);

  // Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // Vehicle
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleType, setVehicleType] = useState<string>('Car');
  const [vehicleSaving, setVehicleSaving] = useState(false);

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }
    setAuthLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
      setStep(2);
    } catch (e: any) {
      Alert.alert('Auth Error', e.message ?? 'Something went wrong. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePermissions = async () => {
    await locationService.requestPermissions();
    setStep(3);
  };

  const handleVehicle = async () => {
    setVehicleSaving(true);
    try {
      await profilesService.upsert({
        vehicle_name: vehicleName.trim() || null,
        vehicle_type: vehicleType,
      });
    } catch {
      // non-fatal — profile can be updated later
    } finally {
      setVehicleSaving(false);
    }
    setStep(4);
  };

  const handleFinish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    router.replace('/paywall');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Back button */}
      {step > 0 && step < 4 && (
        <Pressable onPress={goBack} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
      )}

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
      </View>

      {step === 0 && <StepWelcome onNext={() => setStep(1)} />}
      {step === 1 && (
        <StepAuth
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          isSignUp={isSignUp}
          setIsSignUp={setIsSignUp}
          loading={authLoading}
          onSubmit={handleAuth}
        />
      )}
      {step === 2 && <StepLocation onNext={handlePermissions} onSkip={() => setStep(3)} />}
      {step === 3 && (
        <StepVehicle
          vehicleName={vehicleName}
          setVehicleName={setVehicleName}
          vehicleType={vehicleType}
          setVehicleType={setVehicleType}
          loading={vehicleSaving}
          onFinish={handleVehicle}
        />
      )}
      {step === 4 && <StepReady onFinish={handleFinish} />}
    </SafeAreaView>
  );
}

// ─── Steps ──────────────────────────────────────────────────────────────────

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
        geek out on performance.
      </Text>
      <View style={styles.featureList}>
        {[
          { icon: '📍', text: 'Real-time GPS tracking' },
          { icon: '📊', text: 'Driving score & stats' },
          { icon: '🤖', text: 'Weekly AI insights' },
          { icon: '⛰️', text: 'Altitude & tilt for motos' },
        ].map((f) => (
          <View key={f.text} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>
      <Pressable style={styles.primaryBtn} onPress={onNext}>
        <Text style={styles.primaryBtnText}>Get Started</Text>
      </Pressable>
    </View>
  );
}

function StepAuth({
  email, setEmail, password, setPassword,
  isSignUp, setIsSignUp, loading, onSubmit,
}: {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  isSignUp: boolean; setIsSignUp: (v: boolean) => void;
  loading: boolean; onSubmit: () => void;
}) {
  return (
    <KeyboardAvoidingView
      style={styles.step}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.illustration}>
          <Text style={styles.illustrationIcon}>🔐</Text>
        </View>
        <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
        <Text style={styles.body}>
          {isSignUp
            ? 'Your trips and stats are synced to the cloud — create an account to keep them safe.'
            : 'Sign in to access your trips and stats.'}
        </Text>

        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="#3A3A4A"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Min. 6 characters"
          placeholderTextColor="#3A3A4A"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
        />

        <Pressable
          style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
          onPress={onSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#0A0A0F" />
            : <Text style={styles.primaryBtnText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
          }
        </Pressable>

        <Pressable onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleBtn}>
          <Text style={styles.toggleText}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <Text style={styles.toggleAccent}>{isSignUp ? 'Sign In' : 'Sign Up'}</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StepLocation({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <View style={styles.step}>
      <View style={styles.illustration}>
        <Text style={styles.illustrationIcon}>📍</Text>
      </View>
      <Text style={styles.title}>Background Location</Text>
      <Text style={styles.body}>
        Velox needs background location to track your trips accurately — even when the app is
        minimized.{'\n\n'}Your data is encrypted and{' '}
        <Text style={styles.accent}>never sold</Text>. We only use your location to compute trip
        stats.
      </Text>
      <Pressable style={styles.primaryBtn} onPress={onNext}>
        <Text style={styles.primaryBtnText}>Allow Location Access</Text>
      </Pressable>
      <Pressable onPress={onSkip} hitSlop={8} style={styles.skipBtn}>
        <Text style={styles.skipText}>Skip for now</Text>
      </Pressable>
    </View>
  );
}

function StepVehicle({
  vehicleName, setVehicleName, vehicleType, setVehicleType, loading, onFinish,
}: {
  vehicleName: string; setVehicleName: (v: string) => void;
  vehicleType: string; setVehicleType: (v: string) => void;
  loading: boolean; onFinish: () => void;
}) {
  return (
    <KeyboardAvoidingView
      style={styles.step}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.illustration}>
        <Text style={styles.illustrationIcon}>🚗</Text>
      </View>
      <Text style={styles.title}>Your Vehicle</Text>
      <Text style={styles.body}>
        Give your vehicle a nickname — makes insights personal. You can change this anytime.
      </Text>

      <Text style={styles.inputLabel}>Nickname (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Black Golf GTI"
        placeholderTextColor="#3A3A4A"
        value={vehicleName}
        onChangeText={setVehicleName}
        maxLength={40}
      />

      <Text style={styles.inputLabel}>Type</Text>
      <View style={styles.typeRow}>
        {VEHICLE_TYPES.map((t) => (
          <Pressable
            key={t}
            onPress={() => setVehicleType(t)}
            style={[styles.typeChip, vehicleType === t && styles.typeChipSelected]}
          >
            <Text style={[styles.typeChipText, vehicleType === t && styles.typeChipTextSelected]}>
              {t === 'Car' ? '🚗' : t === 'Motorcycle' ? '🏍️' : t === 'Truck' ? '🚛' : '🚐'}{' '}
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
        onPress={onFinish}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#0A0A0F" />
          : <Text style={styles.primaryBtnText}>Continue</Text>
        }
      </Pressable>
    </KeyboardAvoidingView>
  );
}

function StepReady({ onFinish }: { onFinish: () => void }) {
  return (
    <View style={styles.step}>
      <View style={styles.illustration}>
        <Text style={styles.illustrationIcon}>🎉</Text>
      </View>
      <Text style={styles.title}>You're all set!</Text>
      <Text style={styles.body}>
        Velox is ready to track your drives. Unlock premium to get weekly AI insights, unlimited
        history, and more.
      </Text>
      <Pressable style={styles.primaryBtn} onPress={onFinish}>
        <Text style={styles.primaryBtnText}>See Premium Features</Text>
      </Pressable>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#1E1E2A',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 2,
  },
  progressFill: {
    height: 3,
    backgroundColor: '#00C896',
    borderRadius: 2,
  },
  step: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 16,
    justifyContent: 'center',
  },
  illustration: { alignItems: 'center', marginBottom: 32 },
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
    marginBottom: 28,
  },
  accent: { color: '#00C896', fontWeight: '600' },
  featureList: { gap: 12, marginBottom: 36 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  featureText: { color: '#FFFFFF', fontSize: 15 },
  inputLabel: {
    color: '#8E8EA0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
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
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 32, flexWrap: 'wrap' },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
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
  primaryBtn: {
    backgroundColor: '#00C896',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#0A0A0F', fontSize: 17, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { color: '#8E8EA0', fontSize: 14 },
  toggleBtn: { alignItems: 'center', paddingVertical: 12 },
  toggleText: { color: '#8E8EA0', fontSize: 14 },
  toggleAccent: { color: '#00C896', fontWeight: '600' },
});
