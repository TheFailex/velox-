-- Migration: add new profile fields for onboarding v2
-- Run this in Supabase SQL Editor or via the MCP tool

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username     TEXT,
  ADD COLUMN IF NOT EXISTS country      TEXT,
  ADD COLUMN IF NOT EXISTS speed_unit   TEXT NOT NULL DEFAULT 'kmh',
  ADD COLUMN IF NOT EXISTS vehicle_make  TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_model TEXT;

-- Ensure usernames are unique (allow NULL = not set yet)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
  ON public.profiles (username)
  WHERE username IS NOT NULL;

-- Update the existing RLS policies to cover new columns
-- (no changes needed — existing SELECT/INSERT/UPDATE policies cover all columns)
