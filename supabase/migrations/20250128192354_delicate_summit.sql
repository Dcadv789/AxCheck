/*
  # Initial Schema Setup

  1. New Tables
    - `pillars`
      - `id` (uuid, primary key)
      - `name` (text)
      - `order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `questions`
      - `id` (uuid, primary key)
      - `pillar_id` (uuid, foreign key)
      - `text` (text)
      - `points` (integer)
      - `positive_answer` (text)
      - `answer_type` (text)
      - `order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `diagnostic_results`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `company_data` (jsonb)
      - `answers` (jsonb)
      - `pillar_scores` (jsonb)
      - `total_score` (numeric)
      - `max_possible_score` (numeric)
      - `percentage_score` (numeric)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create pillars table
CREATE TABLE IF NOT EXISTS pillars (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pillar_id uuid REFERENCES pillars(id) ON DELETE CASCADE,
  text text NOT NULL,
  points integer NOT NULL DEFAULT 1,
  positive_answer text NOT NULL,
  answer_type text NOT NULL CHECK (answer_type IN ('BINARY', 'TERNARY')),
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create diagnostic_results table
CREATE TABLE IF NOT EXISTS diagnostic_results (
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

-- Enable Row Level Security
ALTER TABLE pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_results ENABLE ROW LEVEL SECURITY;

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