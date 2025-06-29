/*
  # Fix settings table initialization
  
  1. Changes
    - Drop and recreate settings table
    - Ensure initial row is created with proper UUID
    - Add proper RLS policies
*/

-- Drop existing settings table if it exists
DROP TABLE IF EXISTS settings;

-- Create settings table
CREATE TABLE settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo text,
  navbar_logo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Insert initial settings row with a fixed UUID for consistency
DO $$
BEGIN
  INSERT INTO settings (id)
  VALUES ('00000000-0000-0000-0000-000000000000')
  ON CONFLICT (id) DO NOTHING;
END
$$;