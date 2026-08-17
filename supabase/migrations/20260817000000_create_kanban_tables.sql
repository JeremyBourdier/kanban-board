-- Create kanban_board table for persistent JSON board storage
CREATE TABLE IF NOT EXISTS public.kanban_board (
  id TEXT PRIMARY KEY DEFAULT 'default',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.kanban_board ENABLE ROW LEVEL SECURITY;

-- Allow public read and write access for anonymous users
CREATE POLICY "Allow public read access" 
  ON public.kanban_board 
  FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY "Allow public insert and update access" 
  ON public.kanban_board 
  FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

-- Enable Realtime for kanban_board
ALTER PUBLICATION supabase_realtime ADD TABLE public.kanban_board;
