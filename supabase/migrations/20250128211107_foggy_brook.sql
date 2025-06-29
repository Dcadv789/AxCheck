CREATE TABLE IF NOT EXISTS pillars (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pillar_id uuid NOT NULL REFERENCES pillars(id) ON DELETE CASCADE,
  text text NOT NULL,
  points integer NOT NULL DEFAULT 1,
  positive_answer text NOT NULL CHECK (positive_answer IN ('SIM', 'NÃO')),
  answer_type text NOT NULL CHECK (answer_type IN ('BINARY', 'TERNARY')),
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_pillar_id ON questions (pillar_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions ("order");
CREATE INDEX IF NOT EXISTS idx_pillars_order ON pillars ("order");

ALTER TABLE pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pillars are viewable by everyone"
  ON pillars FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pillars are insertable by authenticated users"
  ON pillars FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Pillars are updatable by authenticated users"
  ON pillars FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Questions are viewable by everyone"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Questions are insertable by authenticated users"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Questions are updatable by authenticated users"
  ON questions FOR UPDATE
  TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pillars_updated_at
  BEFORE UPDATE ON pillars
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();