# Velox — Product Requirements Document

## Overview

Velox is a mobile driving-analytics app for iOS and Android. Think "Strava for driving": users track trips via GPS, see speed graphs and driving scores, and receive weekly AI-generated performance insights. A freemium model (RevenueCat) gates premium features.

---

## Target User

Drivers who care about their performance — car enthusiasts, commuters tracking efficiency, or anyone curious about their habits. Primary ages 18–40, smartphone-native.

---

## Core Value Proposition

1. **Automatic trip detection** — GPS starts recording as soon as the user taps Start.
2. **Driving score** — 0–100 score computed from speed violations and braking harshness.
3. **Weekly AI insights** — Claude generates a personalized 2–3 sentence summary every Monday.
4. **Clean, dark UI** — designed for glanceability while parked.

---

## Platform & Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo SDK 52, Expo Router v4) |
| Language | TypeScript (strict) |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) |
| State | Zustand (trip tracking) + React Query (server data) |
| Payments | RevenueCat (`react-native-purchases`) |
| AI | Anthropic Claude (claude-haiku via Edge Function) |
| Location | expo-location + expo-task-manager (background GPS) |

---

## Screens

| Screen | Route | Description |
|---|---|---|
| Dashboard | `/(tabs)/` | Live speed gauge, 4 stat tiles, Start/Stop button, weekly insight (premium) |
| History | `/(tabs)/history` | FlatList of trips, pull-to-refresh |
| Trip Detail | `/trip/[id]` | Score card, 2x2 stats, speed graph, route map |
| Stats | `/(tabs)/stats` | Lifetime aggregates + 7-day WeeklyChart |
| Paywall | `/paywall` | Feature list + plan selector + CTA |
| Onboarding | `/onboarding` | 3-step: Welcome, Location, Vehicle |
| Profile | `/(tabs)/profile` | Identity card, vehicle edit, sign out |

---

## Freemium Gate

| Feature | Free | Premium |
|---|---|---|
| Trip tracking | yes | yes |
| Trip history (last 20) | yes | yes - unlimited |
| Speed graph | yes | yes |
| Driving score | yes | yes |
| Weekly AI insights | no | yes |
| Driving trends over time | no | yes |
| Cloud sync | no | yes - encrypted |

### Plans
- Monthly: $2.99 / month
- Annual: $19.99 / year (approx 44% off)
- Lifetime: $49.99 one-time

---

## Scoring Algorithm

`scoreDrive(points: GPSPoint[]): number`

1. Start at 100.
2. Penalty proportional to % of GPS points above 120 km/h (max -40).
3. Flat -15 if any point exceeded 160 km/h.
4. Per-event -5 for harsh speed changes >30 km/h between consecutive GPS points (max -25).
5. Clamp result to [0, 100].

---

## Data Model

See `docs/api-schema.md` for full table definitions.

---

## MVP Checklist

- [x] 7 screens built
- [x] GPS tracking + background task
- [x] Supabase auth + trips table
- [x] Profiles table + vehicle editing
- [x] Driving score algorithm
- [x] Weekly insight Edge Function
- [x] RevenueCat stub (requires EAS dev build to test purchases)
- [ ] Supabase project provisioned (fill in .env)
- [ ] RevenueCat project provisioned (fill in .env)
- [ ] EAS dev build configured and tested on device
- [ ] pg_cron configured to trigger weekly-insights every Monday 08:00

---

## Out of Scope (v1)

- Social / leaderboards
- Watch / CarPlay integration
- Route sharing
- Custom speed limit configuration
