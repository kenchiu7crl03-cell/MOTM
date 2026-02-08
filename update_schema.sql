-- 1. Allow anonymous inserts (we will track by name)
ALTER TABLE votes ADD COLUMN IF NOT EXISTS voter_name TEXT;
ALTER TABLE votes ALTER COLUMN user_id DROP NOT NULL;

-- 2. Drop old constraint that required unique user_id
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_user_id_category_id_key;

-- 3. Add new constraint to prevent same name spamming same category (Optional, but good for basic anti-cheat)
-- Note: User can just change name to vote again, but it meets "enter name" requirement.
ALTER TABLE votes ADD CONSTRAINT votes_voter_name_category_id_key UNIQUE (voter_name, category_id);

-- 4. Update Policies for Public Voting
DROP POLICY IF EXISTS "Users can vote" ON votes;
CREATE POLICY "Public can vote" ON votes FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 5. Allow public to read votes (for results)
DROP POLICY IF EXISTS "Users can see their own votes" ON votes;
CREATE POLICY "Everyone can see votes" ON votes FOR SELECT TO anon, authenticated USING (true);
