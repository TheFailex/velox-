import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator, Dimensions, Linking, Modal, Keyboard,
  FlatList, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue, withSpring, withTiming, useAnimatedStyle, Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { locationService } from '@/services/location';
import { supabase, profilesService } from '@/services/supabase';
import { ONBOARDING_KEY } from '@/app/_layout';
import { LoadingState } from '@/components/shared/LoadingState';
import { MAKE_NAMES, getModelsForMake, MOTORBIKE_MAKE_NAMES, getMotorbikeModelsForMake } from '@/data/vehicles';

const { width: W } = Dimensions.get('window');

// ─── Steps ────────────────────────────────────────────────────────────────────
//  0 — Welcome feature carousel (3 slides)
//  1 — Auth (sign up / sign in)
//  2 — Location permissions
//  3 — Vehicle type (Car / Motorbike)
//  4 — Vehicle make + model
//  5 — Username
//  6 — Country + unit preference
//  7 — Safety agreement ("Before you drive")
// → paywall (router.push with fromOnboarding=1)

const TOTAL_STEPS = 8;

const WELCOME_SLIDES = [
  {
    icon: '🏎️',
    title: 'Track Your Trips',
    body: 'Trip Recaps, Driving Score, and smart features for every drive.',
  },
  {
    icon: '📊',
    title: 'Deep Analytics',
    body: 'Speed graphs, route maps, and weekly AI insights to improve your driving.',
  },
  {
    icon: '🏆',
    title: 'Built for Drivers',
    body: 'Designed from the ground up for enthusiasts who care about every detail.',
  },
];

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria', 'Belgium',
  'Bolivia', 'Brazil', 'Bulgaria', 'Canada', 'Chile', 'China', 'Colombia', 'Croatia',
  'Czech Republic', 'Denmark', 'Dominican Republic', 'Ecuador', 'Egypt', 'Estonia',
  'Finland', 'France', 'Germany', 'Greece', 'Guatemala', 'Honduras', 'Hungary',
  'India', 'Indonesia', 'Ireland', 'Israel', 'Italy', 'Japan', 'Jordan', 'Kazakhstan',
  'Latvia', 'Lithuania', 'Luxembourg', 'Malaysia', 'Mexico', 'Morocco', 'Netherlands',
  'New Zealand', 'Nigeria', 'Norway', 'Pakistan', 'Panama', 'Paraguay', 'Peru',
  'Philippines', 'Poland', 'Portugal', 'Romania', 'Russia', 'Saudi Arabia', 'Serbia',
  'Singapore', 'Slovakia', 'Slovenia', 'South Africa', 'South Korea', 'Spain',
  'Sweden', 'Switzerland', 'Taiwan', 'Thailand', 'Turkey', 'Ukraine', 'United Arab Emirates',
  'United Kingdom', 'United States', 'Uruguay', 'Venezuela', 'Vietnam',
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [step, setStep] = useState(0);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  // Step 0 — welcome carousel
  const [welcomeSlide, setWelcomeSlide] = useState(0);
  const welcomeScrollRef = useRef<ScrollView>(null);

  // Step 1 — auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // Step 3 — vehicle type
  const [vehicleCategory, setVehicleCategory] = useState<'Car' | 'Motorbike'>('Car');

  // Step 4 — make / model
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [showMakePicker, setShowMakePicker] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [makeSearch, setMakeSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');

  // Step 5 — username
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // Step 6 — country + unit
  const [country, setCountry] = useState('');
  const [speedUnit, setSpeedUnit] = useState<'kmh' | 'mph'>('kmh');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Saving
  const [isSaving, setIsSaving] = useState(false);

  // Progress bar animated
  const progressAnim = useSharedValue(1 / TOTAL_STEPS);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const [deviceDone, resumeStep] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_KEY),
        AsyncStorage.getItem('onboarding_resume_step'),
      ]);

      if (resumeStep) {
        await AsyncStorage.removeItem('onboarding_resume_step');
        const s = parseInt(resumeStep, 10);
        setOnboardingDone(false);
        setStep(s);
        setTimeout(() => {
          scrollRef.current?.scrollTo({ x: s * W, animated: false });
        }, 120);
      } else if (deviceDone === '1') {
        setOnboardingDone(true);
        setStep(1);
        setTimeout(() => {
          scrollRef.current?.scrollTo({ x: W, animated: false });
        }, 120);
      } else {
        setOnboardingDone(false);
      }
    };
    init();
  }, []);

  // ── Auth listener ─────────────────────────────────────────────────────────

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== 'SIGNED_IN' || !session) return;
      const userKey = `${ONBOARDING_KEY}_${session.user.id}`;
      const userDone = await AsyncStorage.getItem(userKey);
      if (userDone === '1') {
        router.replace('/(tabs)');
      } else {
        goToStep(2); // location
      }
    });
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigation helpers ────────────────────────────────────────────────────

  const goToStep = useCallback((newStep: number) => {
    Keyboard.dismiss();
    setStep(newStep);
    scrollRef.current?.scrollTo({ x: newStep * W, animated: true });
    progressAnim.value = withTiming((newStep + 1) / TOTAL_STEPS, { duration: 350, easing: Easing.out(Easing.quad) });
  }, [progressAnim]);

  const goBack = () => {
    if (step > 0) goToStep(step - 1);
  };

  const handleUsernameNext = async () => {
    const trimmed = username.trim();
    if (!trimmed) return;

    // Only letters, numbers, underscores and dots — no spaces or special chars
    if (!/^[a-zA-Z0-9_.]+$/.test(trimmed)) {
      setUsernameError('invalid');
      Alert.alert(
        'Invalid username',
        'Only letters, numbers, underscores ( _ ) and dots ( . ) are allowed. No spaces or special characters.'
      );
      return;
    }

    setUsernameError(null);
    setIsCheckingUsername(true);
    try {
      const available = await profilesService.checkUsernameAvailable(trimmed);
      if (!available) {
        setUsernameError('taken');
        Alert.alert(
          'Username already taken',
          'That username is already registered. Please choose a different one.'
        );
        return;
      }
      goToStep(6);
    } catch {
      goToStep(6); // non-fatal: proceed without blocking
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // ── Step handlers ─────────────────────────────────────────────────────────

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'velox://auth/callback', skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (data?.url) await Linking.openURL(data.url);
    } catch {
      Alert.alert('Google Sign In', 'Configure Google OAuth in your Supabase dashboard.');
    }
  };

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
    } catch (e: any) {
      Alert.alert('Auth Error', e.message ?? 'Something went wrong.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePermissions = async () => {
    await locationService.requestPermissions();
    goToStep(3);
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      // Save everything in one shot (happy path)
      await profilesService.upsert({
        vehicle_type: vehicleCategory,
        vehicle_make: vehicleMake || null,
        vehicle_model: vehicleModel || null,
        username: username.trim() || null,
        country: country || null,
        speed_unit: speedUnit,
      });
    } catch {
      // If the full upsert fails (e.g. username unique-constraint race),
      // retry without username so vehicle/country/unit are never lost.
      try {
        await profilesService.upsert({
          vehicle_type: vehicleCategory,
          vehicle_make: vehicleMake || null,
          vehicle_model: vehicleModel || null,
          country: country || null,
          speed_unit: speedUnit,
        });
      } catch {
        // truly non-fatal — user can update from profile screen
      }
    } finally {
      setIsSaving(false);
    }

    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await AsyncStorage.setItem(`${ONBOARDING_KEY}_${session.user.id}`, '1');
    }

    // Reset exit offer flag so it shows once per onboarding completion
    await AsyncStorage.removeItem('exit_offer_shown');

    // Push paywall with fromOnboarding flag so it shows the exit offer
    router.push({ pathname: '/paywall', params: { fromOnboarding: '1' } });
  };

  // ── Pickers ───────────────────────────────────────────────────────────────

  const makeNames = vehicleCategory === 'Motorbike' ? MOTORBIKE_MAKE_NAMES : MAKE_NAMES;
  const filteredMakes = makeNames.filter((m) =>
    m.toLowerCase().includes(makeSearch.toLowerCase())
  );
  const filteredModels = (
    vehicleCategory === 'Motorbike'
      ? getMotorbikeModelsForMake(vehicleMake)
      : getModelsForMake(vehicleMake)
  ).filter((m) => m.toLowerCase().includes(modelSearch.toLowerCase()));
  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // ── Guard ─────────────────────────────────────────────────────────────────

  if (onboardingDone === null) return <LoadingState />;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Back button — visible from step 1 onwards */}
      {step > 0 && step < TOTAL_STEPS && (
        <Pressable onPress={goBack} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
      )}

      {/* Progress bar — hidden on step 0 (welcome carousel) */}
      {step > 0 && (
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
      )}

      {/* Main pager */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.pager}
      >
        {/* ── Step 0: Welcome carousel ─────────────────────────────── */}
        <View style={styles.page}>
          <StepWelcome
            slides={WELCOME_SLIDES}
            slideIndex={welcomeSlide}
            scrollRef={welcomeScrollRef}
            onSlideChange={setWelcomeSlide}
            onNext={() => goToStep(1)}
          />
        </View>

        {/* ── Step 1: Auth ─────────────────────────────────────────── */}
        <View style={styles.page}>
          <StepAuth
            email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            isSignUp={isSignUp} setIsSignUp={setIsSignUp}
            loading={authLoading}
            onSubmit={handleAuth}
            onGoogle={handleGoogleSignIn}
          />
        </View>

        {/* ── Step 2: Location ─────────────────────────────────────── */}
        <View style={styles.page}>
          <StepLocation onNext={handlePermissions} onSkip={() => goToStep(3)} />
        </View>

        {/* ── Step 3: Vehicle type ─────────────────────────────────── */}
        <View style={styles.page}>
          <StepVehicleType
            selected={vehicleCategory}
            onSelect={(v) => { setVehicleCategory(v); setVehicleMake(''); setVehicleModel(''); }}
            onNext={() => goToStep(4)}
          />
        </View>

        {/* ── Step 4: Make + Model ─────────────────────────────────── */}
        <View style={styles.page}>
          <StepVehicleModel
            category={vehicleCategory}
            make={vehicleMake}
            model={vehicleModel}
            onOpenMake={() => setShowMakePicker(true)}
            onOpenModel={() => vehicleMake ? setShowModelPicker(true) : null}
            onNext={() => goToStep(5)}
          />
        </View>

        {/* ── Step 5: Username ─────────────────────────────────────── */}
        <View style={styles.page}>
          <StepUsername
            value={username}
            onChange={(v) => { setUsername(v); setUsernameError(null); }}
            onNext={handleUsernameNext}
            isChecking={isCheckingUsername}
            error={usernameError}
          />
        </View>

        {/* ── Step 6: Country + Unit ───────────────────────────────── */}
        <View style={styles.page}>
          <StepCountryUnit
            country={country}
            speedUnit={speedUnit}
            onOpenCountry={() => setShowCountryPicker(true)}
            onSetUnit={setSpeedUnit}
            onNext={() => goToStep(7)}
          />
        </View>

        {/* ── Step 7: Safety ───────────────────────────────────────── */}
        <View style={styles.page}>
          <StepSafety loading={isSaving} onFinish={handleFinish} />
        </View>
      </ScrollView>

      {/* ── Make picker modal ─────────────────────────────────────────── */}
      <PickerModal
        visible={showMakePicker}
        title="Select Make"
        items={filteredMakes}
        search={makeSearch}
        onSearch={setMakeSearch}
        onSelect={(v) => {
          setVehicleMake(v);
          setVehicleModel('');
          setMakeSearch('');
          setShowMakePicker(false);
        }}
        onClose={() => { setMakeSearch(''); setShowMakePicker(false); }}
      />

      {/* ── Model picker modal ────────────────────────────────────────── */}
      <PickerModal
        visible={showModelPicker}
        title="Select Model"
        items={filteredModels}
        search={modelSearch}
        onSearch={setModelSearch}
        onSelect={(v) => {
          setVehicleModel(v);
          setModelSearch('');
          setShowModelPicker(false);
        }}
        onClose={() => { setModelSearch(''); setShowModelPicker(false); }}
      />

      {/* ── Country picker modal ──────────────────────────────────────── */}
      <PickerModal
        visible={showCountryPicker}
        title="Select Country"
        items={filteredCountries}
        search={countrySearch}
        onSearch={setCountrySearch}
        onSelect={(v) => {
          setCountry(v);
          setCountrySearch('');
          setShowCountryPicker(false);
        }}
        onClose={() => { setCountrySearch(''); setShowCountryPicker(false); }}
      />
    </SafeAreaView>
  );
}

// ─── Step: Welcome carousel ───────────────────────────────────────────────────

function StepWelcome({
  slides, slideIndex, scrollRef, onSlideChange, onNext,
}: {
  slides: { icon: string; title: string; body: string }[];
  slideIndex: number;
  scrollRef: React.RefObject<ScrollView>;
  onSlideChange: (i: number) => void;
  onNext: () => void;
}) {
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const handleNext = () => {
    btnScale.value = withSpring(0.94, { damping: 14, stiffness: 380 });
    setTimeout(() => { btnScale.value = withSpring(1, { damping: 14, stiffness: 380 }); }, 100);
    onNext();
  };

  return (
    <View style={styles.welcomeContainer}>
      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / W);
          onSlideChange(idx);
        }}
      >
        {slides.map((slide, i) => (
          <View key={i} style={[styles.welcomeSlide]}>
            <View style={styles.welcomeIconWrap}>
              <Text style={styles.welcomeIcon}>{slide.icon}</Text>
            </View>
            <Text style={styles.welcomeTitle}>{slide.title}</Text>
            <Text style={styles.welcomeBody}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.welcomeDots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.welcomeDot, i === slideIndex && styles.welcomeDotActive]} />
        ))}
      </View>

      {/* CTA */}
      <Animated.View style={[btnStyle, { marginHorizontal: 28, marginBottom: 8 }]}>
        <Pressable style={styles.primaryBtn} onPress={handleNext}>
          <Text style={styles.primaryBtnText}>Get Started</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ─── Step: Auth ───────────────────────────────────────────────────────────────

function StepAuth({
  email, setEmail, password, setPassword, isSignUp, setIsSignUp,
  loading, onSubmit, onGoogle,
}: {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  isSignUp: boolean; setIsSignUp: (v: boolean) => void;
  loading: boolean; onSubmit: () => void; onGoogle: () => void;
}) {
  return (
    <KeyboardAvoidingView style={styles.step} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.stepIcon}><Text style={styles.stepIconText}>🔐</Text></View>
        <Text style={styles.stepTitle}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
        <Text style={styles.stepBody}>
          {isSignUp
            ? 'Your trips are synced to the cloud — create an account to keep them safe.'
            : 'Sign in to access your trips and stats.'}
        </Text>

        <Pressable style={styles.googleBtn} onPress={onGoogle}>
          <Text style={styles.googleBtnText}>🇬  Continue with Google</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

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

// ─── Step: Location ───────────────────────────────────────────────────────────

function StepLocation({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <View style={[styles.step, styles.stepCenter]}>
      <View style={styles.stepIconCircle}>
        <Text style={styles.stepIconText}>📍</Text>
      </View>
      <Text style={styles.stepTitle}>Enable GPS Location Access</Text>
      <Text style={styles.stepBody}>
        Allow location access to track your speed, record trips, and provide accurate
        speedometer readings.{'\n\n'}Your location is{' '}
        <Text style={styles.accent}>never shared</Text>. Used only for trip stats.
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

// ─── Step: Vehicle type ───────────────────────────────────────────────────────

function StepVehicleType({
  selected, onSelect, onNext,
}: { selected: 'Car' | 'Motorbike'; onSelect: (v: 'Car' | 'Motorbike') => void; onNext: () => void }) {
  return (
    <View style={[styles.step, styles.stepCenter]}>
      <Text style={styles.stepTitle}>What do you drive?</Text>
      <Text style={styles.stepBody}>Select your primary vehicle type</Text>

      <View style={styles.vehicleTypeRow}>
        <TouchableOpacity
          onPress={() => onSelect('Car')}
          activeOpacity={0.7}
          style={[styles.vehicleTypeCard, selected === 'Car' && styles.vehicleTypeCardSelected]}
        >
          <Text style={styles.vehicleTypeIcon}>🚗</Text>
          <Text style={[styles.vehicleTypeLabel, selected === 'Car' && styles.vehicleTypeLabelSelected]}>Car</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onSelect('Motorbike')}
          activeOpacity={0.7}
          style={[styles.vehicleTypeCard, selected === 'Motorbike' && styles.vehicleTypeCardSelected]}
        >
          <Text style={styles.vehicleTypeIcon}>🏍️</Text>
          <Text style={[styles.vehicleTypeLabel, selected === 'Motorbike' && styles.vehicleTypeLabelSelected]}>Motorbike</Text>
        </TouchableOpacity>
      </View>

      <Pressable style={styles.primaryBtn} onPress={onNext}>
        <Text style={styles.primaryBtnText}>Continue</Text>
      </Pressable>
    </View>
  );
}

// ─── Step: Vehicle make + model ───────────────────────────────────────────────

function StepVehicleModel({
  category, make, model, onOpenMake, onOpenModel, onNext,
}: {
  category: 'Car' | 'Motorbike'; make: string; model: string;
  onOpenMake: () => void; onOpenModel: () => void; onNext: () => void;
}) {
  const vehicleEmoji = category === 'Motorbike' ? '🏍️' : '🚗';
  const vehicleWord = category === 'Motorbike' ? 'bike' : 'car';

  return (
    <View style={[styles.step, styles.stepCenter]}>
      <View style={styles.vehiclePreviewCircle}>
        <Text style={styles.vehiclePreviewIcon}>{make ? vehicleEmoji : '🔍'}</Text>
        {make ? (
          <Text style={styles.vehiclePreviewText}>{make}{model ? `\n${model}` : ''}</Text>
        ) : (
          <Text style={styles.vehiclePreviewHint}>Select a make and{'\n'}model to see your {vehicleWord}</Text>
        )}
      </View>

      <Text style={styles.stepTitle}>Choose your main ride</Text>
      <Text style={styles.stepBody}>Select the {vehicleWord} you ride the most</Text>

      {/* Make selector */}
      <Pressable style={styles.dropdownBtn} onPress={onOpenMake}>
        <Text style={[styles.dropdownBtnText, !make && styles.dropdownBtnPlaceholder]}>
          {make || 'Select Make'}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#8E8EA0" />
      </Pressable>

      {/* Model selector */}
      <Pressable
        style={[styles.dropdownBtn, !make && styles.dropdownBtnDisabled]}
        onPress={onOpenModel}
      >
        <Text style={[styles.dropdownBtnText, !model && styles.dropdownBtnPlaceholder]}>
          {model || 'Select Model'}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#8E8EA0" />
      </Pressable>

      <Pressable
        style={[styles.primaryBtn, (!make || !model) && styles.primaryBtnDisabled]}
        onPress={make && model ? onNext : undefined}
      >
        <Text style={styles.primaryBtnText}>Continue</Text>
      </Pressable>
    </View>
  );
}

// ─── Step: Username ───────────────────────────────────────────────────────────

function StepUsername({
  value, onChange, onNext, isChecking, error,
}: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  isChecking: boolean;
  error: string | null;
}) {
  const isDisabled = !value.trim() || isChecking;
  return (
    <KeyboardAvoidingView style={[styles.step, styles.stepCenter]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.stepIconCircle}>
        <Text style={styles.stepIconText}>@</Text>
      </View>
      <Text style={styles.stepTitle}>Choose your username</Text>
      <Text style={styles.stepBody}>This is how you'll appear on the leaderboards</Text>

      <View style={[styles.usernameInputWrap, error ? styles.usernameInputError : undefined]}>
        <Text style={styles.usernameAt}>@</Text>
        <TextInput
          style={styles.usernameInput}
          placeholder="username"
          placeholderTextColor="#3A3A4A"
          value={value}
          onChangeText={onChange}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
        />
      </View>

      <Pressable
        style={[styles.primaryBtn, isDisabled && styles.primaryBtnDisabled]}
        onPress={isDisabled ? undefined : onNext}
        disabled={isDisabled}
      >
        {isChecking
          ? <ActivityIndicator color="#0A0A0F" />
          : <Text style={styles.primaryBtnText}>Continue</Text>
        }
      </Pressable>
    </KeyboardAvoidingView>
  );
}

// ─── Step: Country + Unit ─────────────────────────────────────────────────────

function StepCountryUnit({
  country, speedUnit, onOpenCountry, onSetUnit, onNext,
}: {
  country: string; speedUnit: 'kmh' | 'mph';
  onOpenCountry: () => void; onSetUnit: (u: 'kmh' | 'mph') => void; onNext: () => void;
}) {
  return (
    <View style={[styles.step, styles.stepCenter]}>
      <View style={styles.stepIconCircle}>
        <Text style={styles.stepIconText}>🌍</Text>
      </View>
      <Text style={styles.stepTitle}>Your preferences</Text>
      <Text style={styles.stepBody}>Set your country and preferred speed unit</Text>

      {/* Country */}
      <Text style={styles.inputLabel}>Country</Text>
      <Pressable style={styles.dropdownBtn} onPress={onOpenCountry}>
        <Text style={[styles.dropdownBtnText, !country && styles.dropdownBtnPlaceholder]}>
          {country || 'Select your country'}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#8E8EA0" />
      </Pressable>

      {/* Speed unit toggle */}
      <Text style={[styles.inputLabel, { marginTop: 20 }]}>Speed unit</Text>
      <View style={styles.unitToggleRow}>
        {(['kmh', 'mph'] as const).map((u) => (
          <Pressable
            key={u}
            onPress={() => onSetUnit(u)}
            style={[styles.unitToggleBtn, speedUnit === u && styles.unitToggleBtnActive]}
          >
            <Text style={[styles.unitToggleText, speedUnit === u && styles.unitToggleTextActive]}>
              {u === 'kmh' ? 'km/h' : 'mph'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.primaryBtn, { marginTop: 24 }, !country && styles.primaryBtnDisabled]}
        onPress={country ? onNext : undefined}
      >
        <Text style={styles.primaryBtnText}>Continue</Text>
      </Pressable>
    </View>
  );
}

// ─── Step: Safety ─────────────────────────────────────────────────────────────

function StepSafety({ loading, onFinish }: { loading: boolean; onFinish: () => void }) {
  const [agreed, setAgreed] = useState(false);
  const checkScale = useSharedValue(1);
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }));

  const toggleAgree = () => {
    checkScale.value = withSpring(0.85, { damping: 12, stiffness: 400 });
    setTimeout(() => { checkScale.value = withSpring(1, { damping: 12, stiffness: 400 }); }, 100);
    setAgreed((v) => !v);
  };

  return (
    <ScrollView contentContainerStyle={[styles.step, styles.stepCenter, { paddingBottom: 20 }]}>
      <Text style={styles.safetyWarningIcon}>⚠️</Text>
      <Text style={styles.stepTitle}>Before you drive</Text>
      <Text style={styles.stepBody}>Important reminders to stay safe</Text>

      <View style={styles.safetyCard}>
        {[
          { icon: '🖐️', text: 'Obey local traffic laws and speed limits. Never drive recklessly.' },
          { icon: '🚗', text: 'Start and stop recording only while safely parked.' },
          { icon: '📱', text: 'Use a phone holder, just like with any navigation app.' },
          { icon: '👁️', text: 'Never touch your phone while driving. Eyes on the road.' },
        ].map((item, i) => (
          <View key={i} style={styles.safetyRow}>
            <View style={styles.safetyIconWrap}>
              <Text style={styles.safetyItemIcon}>{item.icon}</Text>
            </View>
            <Text style={styles.safetyItemText}>{item.text}</Text>
          </View>
        ))}
      </View>

      <Pressable onPress={toggleAgree} style={styles.agreementRow}>
        <Animated.View style={[styles.checkbox, agreed && styles.checkboxChecked, checkStyle]}>
          {agreed && <Text style={styles.checkmark}>✓</Text>}
        </Animated.View>
        <Text style={styles.agreementText}>
          I acknowledge these guidelines and agree to drive responsibly
        </Text>
      </Pressable>

      <Text style={styles.agreementSub}>
        You are solely responsible for your driving. Velox is a tracking tool and does not
        encourage speeding or dangerous driving.
      </Text>

      <Pressable
        style={[styles.primaryBtn, (!agreed || loading) && styles.primaryBtnDisabled]}
        onPress={agreed ? onFinish : undefined}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#0A0A0F" />
          : <Text style={styles.primaryBtnText}>I Agree & Continue</Text>
        }
      </Pressable>
    </ScrollView>
  );
}

// ─── Picker modal ─────────────────────────────────────────────────────────────

function PickerModal({
  visible, title, items, search, onSearch, onSelect, onClose,
}: {
  visible: boolean;
  title: string;
  items: string[];
  search: string;
  onSearch: (v: string) => void;
  onSelect: (v: string) => void;
  onClose: () => void;
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  backBtn: { position: 'absolute', top: 56, left: 20, zIndex: 10, padding: 8 },
  progressTrack: {
    height: 3,
    backgroundColor: '#1E1E2A',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 2,
  },
  progressFill: { height: 3, backgroundColor: '#00C896', borderRadius: 2 },
  pager: { flex: 1, marginTop: 8 },
  page: { width: W, flex: 1 },

  step: {
    flex: 1,
    width: W,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 16,
  },
  stepCenter: { justifyContent: 'center' },

  // Welcome carousel — no padding on the container so the inner ScrollView fills W exactly
  welcomeContainer: {
    flex: 1,
    paddingTop: 24,
    paddingBottom: 16,
  },
  welcomeSlide: {
    width: W,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  welcomeIconWrap: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#14141C',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  welcomeIcon: { fontSize: 80 },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeBody: {
    color: '#8E8EA0',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  welcomeDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
    marginTop: 8,
  },
  welcomeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2A2A3A' },
  welcomeDotActive: { width: 20, backgroundColor: '#00C896' },

  // Shared step elements
  stepIcon: { alignItems: 'center', marginBottom: 24 },
  stepIconText: { fontSize: 72 },
  stepIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,200,150,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,200,150,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    alignSelf: 'center',
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  stepBody: {
    color: '#8E8EA0',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  accent: { color: '#00C896', fontWeight: '600' },

  // Auth
  googleBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  googleBtnText: { color: '#0A0A0F', fontSize: 16, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerText: { color: '#8E8EA0', fontSize: 13 },
  inputLabel: {
    color: '#8E8EA0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    alignSelf: 'flex-start',
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
    width: '100%',
  },

  // Vehicle type
  vehicleTypeRow: { flexDirection: 'row', gap: 14, marginBottom: 28, width: '100%' },
  vehicleTypeCard: {
    flex: 1,
    backgroundColor: '#14141C',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  vehicleTypeCardSelected: {
    borderColor: '#00C896',
    backgroundColor: 'rgba(0,200,150,0.08)',
  },
  vehicleTypeIcon: { fontSize: 44, marginBottom: 10 },
  vehicleTypeLabel: { color: '#8E8EA0', fontSize: 16, fontWeight: '600' },
  vehicleTypeLabelSelected: { color: '#00C896' },

  // Vehicle model
  vehiclePreviewCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#14141C',
    borderWidth: 2,
    borderColor: 'rgba(0,200,150,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    alignSelf: 'center',
    gap: 8,
  },
  vehiclePreviewIcon: { fontSize: 52 },
  vehiclePreviewText: {
    color: '#00C896',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  vehiclePreviewHint: { color: '#8E8EA0', fontSize: 12, textAlign: 'center', lineHeight: 18 },
  dropdownBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#14141C',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
  },
  dropdownBtnDisabled: { opacity: 0.4 },
  dropdownBtnText: { color: '#FFFFFF', fontSize: 16 },
  dropdownBtnPlaceholder: { color: '#3A3A4A' },

  // Username
  usernameInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14141C',
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 28,
    width: '100%',
  },
  usernameAt: { color: '#8E8EA0', fontSize: 18, fontWeight: '600', marginRight: 4 },
  usernameInput: { flex: 1, color: '#FFFFFF', fontSize: 18, paddingVertical: 16 },
  usernameInputError: { borderColor: '#FF4B4B' },
  usernameErrorText: {
    color: '#FF4B4B', fontSize: 13, marginTop: -18, marginBottom: 16,
    alignSelf: 'flex-start', width: '100%',
  },

  // Country + unit
  unitToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#14141C',
    borderRadius: 14,
    padding: 4,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  unitToggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  unitToggleBtnActive: { backgroundColor: '#00C896' },
  unitToggleText: { color: '#8E8EA0', fontSize: 16, fontWeight: '600' },
  unitToggleTextActive: { color: '#0A0A0F' },

  // Safety
  safetyWarningIcon: { fontSize: 52, textAlign: 'center', marginBottom: 12, alignSelf: 'center' },
  safetyCard: {
    backgroundColor: '#14141C',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    width: '100%',
  },
  safetyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  safetyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,200,150,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyItemIcon: { fontSize: 16 },
  safetyItemText: { color: '#FFFFFF', fontSize: 14, lineHeight: 20, flex: 1 },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
    width: '100%',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3A3A4A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: '#00C896', borderColor: '#00C896' },
  checkmark: { color: '#0A0A0F', fontSize: 14, fontWeight: '700' },
  agreementText: { color: '#FFFFFF', fontSize: 14, lineHeight: 20, flex: 1, fontWeight: '500' },
  agreementSub: { color: '#8E8EA0', fontSize: 11, textAlign: 'center', lineHeight: 16, marginBottom: 20, width: '100%' },

  // Buttons
  primaryBtn: {
    backgroundColor: '#00C896',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: '#0A0A0F', fontSize: 17, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { color: '#8E8EA0', fontSize: 14 },
  toggleBtn: { alignItems: 'center', paddingVertical: 12 },
  toggleText: { color: '#8E8EA0', fontSize: 14 },
  toggleAccent: { color: '#00C896', fontWeight: '600' },

  // Picker modal
  pickerContainer: { flex: 1, backgroundColor: '#0A0A0F' },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  pickerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  pickerSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14141C',
    borderRadius: 12,
    margin: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  pickerSearch: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  pickerItem: { paddingHorizontal: 20, paddingVertical: 16 },
  pickerItemText: { color: '#FFFFFF', fontSize: 16 },
  pickerSep: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 20 },
});
