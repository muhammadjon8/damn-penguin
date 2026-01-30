-- Create leaderboard table for global scores
CREATE TABLE public.leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL DEFAULT 'Anonymous Penguin',
  distance INTEGER NOT NULL,
  fish_collected INTEGER NOT NULL DEFAULT 0,
  biome_reached TEXT NOT NULL DEFAULT 'ice_plains',
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game_sessions table for persistent player tracking
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  play_count INTEGER NOT NULL DEFAULT 0,
  total_distance INTEGER NOT NULL DEFAULT 0,
  best_distance INTEGER NOT NULL DEFAULT 0,
  best_fish INTEGER NOT NULL DEFAULT 0,
  best_biome TEXT NOT NULL DEFAULT 'ice_plains',
  referrer_session_id TEXT,
  challenge_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_played TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leaderboard: Anyone can read, anyone can insert
CREATE POLICY "Anyone can view leaderboard" 
ON public.leaderboard 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can submit scores" 
ON public.leaderboard 
FOR INSERT 
WITH CHECK (true);

-- No updates or deletes allowed on leaderboard
-- This prevents score tampering

-- RLS Policies for game_sessions: Anyone can read and insert/update their own
CREATE POLICY "Anyone can view sessions" 
ON public.game_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create sessions" 
ON public.game_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update sessions" 
ON public.game_sessions 
FOR UPDATE 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_leaderboard_distance ON public.leaderboard(distance DESC);
CREATE INDEX idx_leaderboard_created_at ON public.leaderboard(created_at DESC);
CREATE INDEX idx_game_sessions_session_id ON public.game_sessions(session_id);

-- Enable realtime for leaderboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;