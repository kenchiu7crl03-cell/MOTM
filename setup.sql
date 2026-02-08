-- Database Schema for MOTM Voting App
-- Run this in your Supabase SQL Editor

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  number INTEGER NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create config table
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, category_id)
);

-- 6. Insert default config
INSERT INTO config (key, value) VALUES ('voting_active', true) ON CONFLICT (key) DO NOTHING;

-- 7. Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- 8. Policies
CREATE POLICY "Public Read Categories" ON categories FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Public Read Candidates" ON candidates FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Public Read Config" ON config FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Users can vote" ON votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can see their own votes" ON votes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin full access" ON votes FOR ALL TO service_role USING (true);
