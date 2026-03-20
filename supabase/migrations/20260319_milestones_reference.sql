CREATE TABLE IF NOT EXISTS milestones_reference (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  age_months_min INTEGER NOT NULL,
  age_months_max INTEGER NOT NULL,
  category TEXT NOT NULL,
  milestone_text TEXT NOT NULL,
  stage_name TEXT NOT NULL,
  is_who_standard BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE milestones_reference ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON milestones_reference FOR SELECT TO authenticated USING (true);
