-- Recria as tabelas com as relações corretas
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS pillars;
DROP TABLE IF EXISTS diagnostic_results;
DROP TABLE IF EXISTS settings;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create pillars table
CREATE TABLE pillars (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create questions table with proper foreign key
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pillar_id uuid REFERENCES pillars(id) ON DELETE CASCADE,
  text text NOT NULL,
  points integer NOT NULL DEFAULT 1,
  positive_answer text NOT NULL CHECK (positive_answer IN ('SIM', 'NÃO')),
  answer_type text NOT NULL CHECK (answer_type IN ('BINARY', 'TERNARY')),
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_pillar FOREIGN KEY (pillar_id) REFERENCES pillars(id)
);

-- Create diagnostic_results table
CREATE TABLE diagnostic_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_data jsonb NOT NULL,
  answers jsonb NOT NULL,
  pillar_scores jsonb NOT NULL,
  total_score numeric NOT NULL,
  max_possible_score numeric NOT NULL,
  percentage_score numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create settings table
CREATE TABLE settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  logo text,
  navbar_logo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies for pillars
CREATE POLICY "Pillars are viewable by everyone"
  ON pillars
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pillars are insertable by authenticated users"
  ON pillars
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Pillars are updatable by authenticated users"
  ON pillars
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for questions
CREATE POLICY "Questions are viewable by everyone"
  ON questions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Questions are insertable by authenticated users"
  ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Questions are updatable by authenticated users"
  ON questions
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for diagnostic_results
CREATE POLICY "Users can view their own diagnostic results"
  ON diagnostic_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diagnostic results"
  ON diagnostic_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for settings
CREATE POLICY "Settings are viewable by everyone"
  ON settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Settings are updatable by authenticated users"
  ON settings
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_pillars_updated_at
  BEFORE UPDATE ON pillars
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial settings row
INSERT INTO settings (id) VALUES (uuid_generate_v4());