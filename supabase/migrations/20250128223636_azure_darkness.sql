/*
  # Fix settings table initialization
  
  1. Changes
    - Drop and recreate settings table with proper initialization
    - Add explicit RLS policies
    - Add trigger for updated_at
  
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Drop existing settings table if it exists
DROP TABLE IF EXISTS settings;

-- Recreate settings table
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
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Settings are updatable by authenticated users"
  ON settings FOR UPDATE
  TO authenticated
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial settings row
INSERT INTO settings (id) VALUES (gen_random_uuid());