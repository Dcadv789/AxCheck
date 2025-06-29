/*
  # Create settings table for logo management
  
  1. New Tables
    - `settings`
      - `id` (uuid, primary key)
      - `logo` (text, nullable)
      - `navbar_logo` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `settings` table
    - Add policies for authenticated users to read and update settings
*/

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo text,
  navbar_logo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

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

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial settings row
INSERT INTO settings (id) VALUES (gen_random_uuid());