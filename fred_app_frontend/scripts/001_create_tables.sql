-- Create tables for Fred pet care app
-- All tables will use RLS for security

-- Routine items table
CREATE TABLE IF NOT EXISTS routine_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL CHECK (period IN ('morning', 'afternoon', 'evening')),
  task TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Glucose readings table
CREATE TABLE IF NOT EXISTS glucose_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value INTEGER NOT NULL,
  time_of_day TEXT NOT NULL,
  protocol TEXT,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mood entries table
CREATE TABLE IF NOT EXISTS mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  energy_level TEXT CHECK (energy_level IN ('high', 'medium', 'low')),
  general_mood TEXT[] DEFAULT '{}', -- Array to allow multiple selections
  appetite TEXT CHECK (appetite IN ('high', 'normal', 'low', 'didnt_eat')),
  walk TEXT CHECK (walk IN ('long', 'short', 'no_walk')),
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE routine_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE glucose_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a single-pet app)
-- In a multi-user app, you would use auth.uid() for user-specific access

-- Routine items policies
CREATE POLICY "Allow all operations on routine_items" ON routine_items
  FOR ALL USING (true) WITH CHECK (true);

-- Glucose readings policies  
CREATE POLICY "Allow all operations on glucose_readings" ON glucose_readings
  FOR ALL USING (true) WITH CHECK (true);

-- Mood entries policies
CREATE POLICY "Allow all operations on mood_entries" ON mood_entries
  FOR ALL USING (true) WITH CHECK (true);
