/*
  # Initial Schema Setup

  1. New Tables
    - users
      - id (uuid, primary key)
      - email (text, unique)
      - full_name (text)
      - phone (text)
      - position (text)
      - photo_url (text)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - settings
      - id (uuid, primary key)
      - logo_url (text)
      - navbar_logo_url (text)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - pillars
      - id (uuid, primary key)
      - name (text)
      - order_number (integer)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - questions
      - id (uuid, primary key)
      - pillar_id (uuid, foreign key)
      - text (text)
      - points (integer)
      - positive_answer (text)
      - answer_type (text)
      - order_number (integer)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - diagnostic_results
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - company_name (text)
      - company_cnpj (text)
      - contact_name (text)
      - has_partners (boolean)
      - employee_count (integer)
      - revenue (numeric)
      - segment (text)
      - time_in_business (text)
      - location (text)
      - legal_form (text)
      - total_score (numeric)
      - max_possible_score (numeric)
      - percentage_score (numeric)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - diagnostic_answers
      - id (uuid, primary key)
      - diagnostic_id (uuid, foreign key)
      - question_id (uuid, foreign key)
      - answer (text)
      - created_at (timestamp)
      - updated_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  position text,
  photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Settings table
CREATE TABLE settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  logo_url text,
  navbar_logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings"
  ON settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can update settings"
  ON settings
  FOR UPDATE
  TO authenticated
  USING (true);

-- Pillars table
CREATE TABLE pillars (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  order_number integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pillars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pillars"
  ON pillars
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can manage pillars"
  ON pillars
  FOR ALL
  TO authenticated
  USING (true);

-- Questions table
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pillar_id uuid REFERENCES pillars(id) ON DELETE CASCADE,
  text text NOT NULL,
  points integer NOT NULL,
  positive_answer text NOT NULL,
  answer_type text NOT NULL,
  order_number integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read questions"
  ON questions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can manage questions"
  ON questions
  FOR ALL
  TO authenticated
  USING (true);

-- Diagnostic Results table
CREATE TABLE diagnostic_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  company_cnpj text NOT NULL,
  contact_name text NOT NULL,
  has_partners boolean NOT NULL,
  employee_count integer NOT NULL,
  revenue numeric NOT NULL,
  segment text NOT NULL,
  time_in_business text NOT NULL,
  location text NOT NULL,
  legal_form text NOT NULL,
  total_score numeric NOT NULL,
  max_possible_score numeric NOT NULL,
  percentage_score numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE diagnostic_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own diagnostic results"
  ON diagnostic_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own diagnostic results"
  ON diagnostic_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own diagnostic results"
  ON diagnostic_results
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Diagnostic Answers table
CREATE TABLE diagnostic_answers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  diagnostic_id uuid REFERENCES diagnostic_results(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  answer text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE diagnostic_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own diagnostic answers"
  ON diagnostic_answers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_results dr
      WHERE dr.id = diagnostic_answers.diagnostic_id
      AND dr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own diagnostic answers"
  ON diagnostic_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostic_results dr
      WHERE dr.id = diagnostic_answers.diagnostic_id
      AND dr.user_id = auth.uid()
    )
  );

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_pillars_updated_at
  BEFORE UPDATE ON pillars
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_diagnostic_results_updated_at
  BEFORE UPDATE ON diagnostic_results
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_diagnostic_answers_updated_at
  BEFORE UPDATE ON diagnostic_answers
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();