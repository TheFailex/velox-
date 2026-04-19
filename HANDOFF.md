# Velox — Project Handoff

> **IMPORTANT:** Delete this file immediately after reading it. It contains context for continuing development and should not stay in the repo.

---

## What is Velox

A React Native driving tracker app. The user starts a trip, the app tracks GPS in the background, and when the trip ends it saves distance, duration, top/avg speed, driving score, altitude, and the full GPS route to Supabase. Users can review trip history, see a speed graph, see a map of the route, and view aggregate stats. Premium unlocks unlimited trip history, the speed graph, the route map, stats, and weekly AI insights.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Expo SDK 53 / React Native 0.79.6 |
| Router | Expo Router v5 (file-based, typed routes) |
| State | Zustand v5 |
| Server state | TanStack Query v5 |
| Backend | Supabase (auth + postgres) |
| Monetisation | RevenueCat v9 |
| Animations | React Native Reanimated 3 |
| Maps | WebView + Leaflet.js + CartoDB dark tiles (no Google Maps SDK) |
| Speed graph | react-native-svg |
| Location | expo-location + expo-task-manager (background task) |
| Notifications | expo-notifications + custom native module (TripNotification) |
| Build | EAS Build — `eas build --platform android --profile production` |

---

## Environment Variables

All set via EAS (expo.dev dashboard → Project → Environment Variables):

| Variable | Where used |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | supabase client |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | supabase client |
| `EXPO_PUBLIC_RC_ANDROID_KEY` | RevenueCat init |
| `EXPO_PUBLIC_RC_IOS_KEY` | RevenueCat init (iOS, not yet built) |
| `EXPO_PUBLIC_GOOGLE_MAPS_KEY` | app.json placeholder (unused — WebView maps instead) |

**Critical:** There must be exactly ONE entry per key in EAS. Previously there were duplicate SENSITIVE entries with a test key that blocked the correct SECRET entry — those were deleted. If RC crashes with "Wrong API Key" on launch, check for duplicate env vars on expo.dev.

---

## App Structure

```
src/
  app/
    _layout.tsx          — Root layout: auth guard, RC init, GlobalTabBar
    onboarding/index.tsx — 4-step onboarding (auth → vehicle → location → done)
    paywall.tsx          — Premium purchase screen
    auth/                — OAuth callback
    (tabs)/
      _layout.tsx        — Horizontal ScrollView pager (all 4 tabs mounted at once)
      index.tsx          — Dashboard (speed gauge, live stats, START/STOP TRIP)
      history.tsx        — Trip list (free: 5 trips, premium: unlimited)
      stats.tsx          — Aggregate stats + weekly chart
      profile.tsx        — User info, vehicle, sign out, upgrade CTA
    trip/[id].tsx        — Trip detail (score, stats, speed graph, map)
  components/
    shared/GlobalTabBar.tsx   — Floating tab bar (absolutely positioned, always on top)
    trip/TripCard.tsx         — Card in history list, captures position for shared-element animation
    trip/TripMap.tsx          — WebView Leaflet map
    trip/SpeedGraph.tsx       — SVG speed-over-time graph
    ui/                       — SpeedGauge, StatTile, Card, etc.
  services/
    supabase.ts          — tripsService, profilesService, weeklyInsightsService
    location.ts          — locationService (start/stop GPS task, permissions)
    revenuecat.ts        — initRevenueCat, checkPremium, restorePurchases
    tabNav.ts            — registerTabGoTo / navigateToTab (bridges GlobalTabBar → tabs ScrollView)
  store/
    tabStore.ts          — activeTab, isTabBarVisible, pendingTab
    subscriptionStore.ts — isPremium (global, updated immediately on purchase)
    tripStore.ts         — live GPS points, trip state
    cardOrigin.ts        — stores TripCard screen position for shared-element animation
  hooks/
    useTrip.ts           — startTrip, stopTrip, isTracking, liveStats, isSaving
    useSubscription.ts   — reads from subscriptionStore, exposes openPaywall()
    useStats.ts          — aggregate stats from Supabase
    useWeeklyInsight.ts  — latest weekly AI insight
    useProfile.ts        — vehicle name/type, updateProfile
```

---

## Design System

### Colours
| Token | Hex | Usage |
|---|---|---|
| Background | `#0A0A0F` | All screen backgrounds |
| Surface | `#14141C` | Cards, modals, inputs |
| Primary | `#00C896` | Active elements, CTA buttons, accents |
| Danger | `#FF4B4B` | STOP TRIP button, end marker on map |
| Warning | `#F0A500` | Mid-range driving score |
| Text primary | `#FFFFFF` | Headings, values |
| Text secondary | `#8E8EA0` | Labels, subtitles |
| Text muted | `#3A3A4A` | Disabled states, "Maybe later" |
| Border subtle | `rgba(255,255,255,0.06)` | Card borders |
| Border medium | `rgba(255,255,255,0.1)` | Tab bar border |

### Typography
- Headers: 28px, weight 700, letterSpacing -0.5
- Section titles: 11px, weight 700, letterSpacing 1.5, UPPERCASE
- Body: 15px, weight 400–500
- Values (stats): 20–22px, weight 700
- Big score: 72px, weight 700, letterSpacing -2
- No custom font — system default

### Spacing & Radius
- Screen horizontal padding: 20–24px
- Card border radius: 12–16px
- Tab bar border radius: 40px (pill)
- Gaps between cards: 12px

---

## Tab Navigation Architecture

The tab bar is a **custom floating pill** (`GlobalTabBar`), absolutely positioned at `bottom: 24, left: 20, right: 20`, rendered in the root `_layout.tsx` on top of every screen.

The tabs themselves are a **horizontal ScrollView** in `(tabs)/_layout.tsx` with all 4 screens mounted simultaneously (not lazy). `scrollEnabled={true}` — the user can swipe between tabs AND tap the bar. `onMomentumScrollEnd` syncs `activeTab` in the store when swiping.

**Navigation from outside the tabs group** (e.g. trip detail → tab bar tap):
1. `GlobalTabBar` sets `pendingTab` in the store, then calls `router.back()`
2. `(tabs)/_layout.tsx` picks up `pendingTab` via `InteractionManager.runAfterInteractions` and scrolls the ScrollView to the correct position

**Never use `router.replace('/(tabs)')` to return to tabs** — it creates a duplicate stack entry that breaks the Android back gesture. Always use `router.back()`.

---

## Animations & Interactions

### Tab bar items
- Scale spring on press: `0.78` → `1`, `{ damping: 15, stiffness: 400 }`
- Uses `onResponderGrant/Release/Terminate` (not Pressable) for reliable gesture handling

### START TRIP button
- Two expanding border rings (ripple): scale `1 → 1.55` over 650ms, `Easing.out(Easing.quad)`, ring 2 delayed 200ms
- Button scale spring: `0.94` → `1` over 120ms
- `startTrip()` is called 580ms after tap (after ripple animation completes)
- STOP TRIP: immediate, no animation

### Trip card → trip detail (shared-element)
- `TripCard` measures its screen position with `onLayout` + `measure`, stores it in `cardOrigin` store just before `router.push`
- `trip/[id].tsx` reads origin on mount and uses a custom Reanimated `entering` animation: screen expands from card position (translate + scale) over 420ms
- Back: reverse animation (screen contracts back to card), then `router.back()` called via `runOnJS` when opacity hits 0

### Paywall
- Opens via `router.push('/paywall')` (push, not replace)
- Closes via `router.back()` (X button, "Maybe later", successful purchase, restore)

---

## Location & Trip Tracking

- Background task: `VELOX_TRIP_TRACKING` via `expo-task-manager`
- 1-second GPS updates, `BestForNavigation` accuracy
- Each GPS point: `{ lat, lng, speed (km/h), altitude (m), timestamp (Unix ms) }`
- Live notification updated in-place via custom native module `TripNotification` (Kotlin) — shows speed, distance, elapsed time without creating a new notification
- Driving score: 0–100, calculated on trip end (algorithm in `useTrip.ts`)

---

## Supabase Tables

- `trips` — full trip data including `route` (JSONB array of GPSPoints)
- `profiles` — `user_id`, `vehicle_name`, `vehicle_type`
- `weekly_insights` — `user_id`, `week_start`, `summary` (AI-generated text)

RLS is enabled. Auth is email/password + Google OAuth (implicit flow via deep link `velox://auth/callback`).

---

## RevenueCat Setup

- Android key: `EXPO_PUBLIC_RC_ANDROID_KEY` (EAS Secret, `goog_` prefix)
- Entitlement identifier: `velox_premium_v2`
- Offering identifier: `default_v2` (set as current offering)
- Packages: `$rc_monthly` (Monthly), `$rc_annual` (Annual), `$rc_lifetime` (Lifetime)
- Products in Google Play: `velox_monthly` (subscription), `velox_annual` (subscription), `velox_lifetime` (non-consumable)
- Code matches packages by `PACKAGE_TYPE` (not product identifier) — robust to Play Store ID changes
- `isPremium` state lives in `subscriptionStore` (Zustand) — updated immediately on purchase without needing to refetch

---

## Build & Release Process

### Every new build:
1. Make code changes
2. Bump `android.versionCode` in `app.json` by 1 (current: **14**)
3. Run: `eas build --platform android --profile production`
4. Upload the `.aab` to Google Play Console → Internal Testing (or higher track)

### versionCode history
| versionCode | Notes |
|---|---|
| 12 | Previous stable |
| 13 | Paywall navigation fix, swipe gestures, RC entitlement fix |
| 14 | Subscription store (isPremium global state), RC package type matching |

### EAS profiles (`eas.json`)
- `development`: dev client, internal distribution
- `preview`: internal distribution
- `production`: store build

---

## Auth Flow

1. New user → `/onboarding` (4 steps: auth, vehicle, location permission, done)
2. After onboarding → `AsyncStorage.setItem('onboarding_complete_<userId>', '1')` then `/paywall`
3. On subsequent launches: `INITIAL_SESSION` auth event → RC initialized → nav guard sends to `/(tabs)`
4. Google OAuth: deep link `velox://auth/callback#access_token=...&refresh_token=...` handled in root `_layout.tsx`
5. Sign out → `supabase.auth.signOut()` → nav guard sends to `/onboarding`

---

## Known Limitations / Pending

- **iOS**: Not built yet. RC iOS key is set but never tested. Maps (WebView/Leaflet) should work. Notification native module is Android-only — needs iOS equivalent or conditional.
- **Weekly insights**: The `weekly_insights` table is populated externally (presumably a cron/edge function that calls an LLM). Not implemented yet.
- **Driving score algorithm**: Exists in `useTrip.ts` — verify the formula is correct.
- **Free tier**: Limited to last 5 trips in history. Premium gates: full history, speed graph, route map, stats screen, weekly insight card on dashboard.
- **Stats screen** (`stats.tsx`): Exists but not reviewed in this session — verify it works with the `useStats` hook.
- **react-native-maps**: Still in `package.json` as a dependency but not used anywhere (replaced by WebView+Leaflet). Can be removed to slim the build.

---

## Key Decisions to Remember

- **No Google Maps SDK** — switched to WebView + Leaflet + CartoDB dark tiles to avoid requiring a Maps API key. `TripMap` is a WebView component with inline HTML.
- **All tabs always mounted** — the ScrollView in `(tabs)/_layout.tsx` renders all 4 screens at once. This is intentional for instant tab switching. Side effect: hooks run on app load, not on tab focus.
- **`router.back()` not `router.replace`** — any screen outside `(tabs)` must use `router.back()` to return. Using `replace` duplicates the tabs stack entry.
- **`INITIAL_SESSION` event** — Supabase fires this (not `SIGNED_IN`) when a returning user opens the app. RC must be initialized here or premium won't work for returning users.
- **EAS env var priority** — SENSITIVE type overrides SECRET type. If RC key is wrong, check for duplicate env vars on expo.dev (SENSITIVE entries from old sessions can shadow the correct SECRET entry).
