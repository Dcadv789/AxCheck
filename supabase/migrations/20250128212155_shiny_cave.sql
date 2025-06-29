-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create pillars table
CREATE TABLE public.pillars (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pillar_id uuid NOT NULL,
  text text NOT NULL,
  points integer NOT NULL DEFAULT 1,
  positive_answer text NOT NULL CHECK (positive_answer IN ('SIM', 'NÃO')),
  answer_type text NOT NULL CHECK (answer_type IN ('BINARY', 'TERNARY')),
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_pillar
    FOREIGN KEY (pillar_id)
    REFERENCES public.pillars(id)
    ON DELETE CASCADE
);

-- Create diagnostic_results table
CREATE TABLE public.diagnostic_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  company_data jsonb NOT NULL,
  answers jsonb NOT NULL,
  pillar_scores jsonb NOT NULL,
  total_score numeric NOT NULL,
  max_possible_score numeric NOT NULL,
  percentage_score numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

-- Create settings table
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  logo text,
  navbar_logo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_questions_pillar_id ON public.questions (pillar_id);
CREATE INDEX idx_questions_order ON public.questions ("order");
CREATE INDEX idx_pillars_order ON public.pillars ("order");
CREATE INDEX idx_diagnostic_results_user_id ON public.diagnostic_results (user_id);
CREATE INDEX idx_diagnostic_results_created_at ON public.diagnostic_results (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies for pillars
CREATE POLICY "Pillars are viewable by everyone"
  ON public.pillars
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pillars are insertable by authenticated users"
  ON public.pillars
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Pillars are updatable by authenticated users"
  ON public.pillars
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for questions
CREATE POLICY "Questions are viewable by everyone"
  ON public.questions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Questions are insertable by authenticated users"
  ON public.questions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Questions are updatable by authenticated users"
  ON public.questions
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for diagnostic_results
CREATE POLICY "Users can view their own diagnostic results"
  ON public.diagnostic_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diagnostic results"
  ON public.diagnostic_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for settings
CREATE POLICY "Settings are viewable by everyone"
  ON public.settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Settings are updatable by authenticated users"
  ON public.settings
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_pillars_updated_at
  BEFORE UPDATE ON public.pillars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial settings row
INSERT INTO public.settings (id) VALUES (uuid_generate_v4());