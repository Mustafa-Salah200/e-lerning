-- Add new columns to assignments table for enhanced functionality
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS submission_type text NOT NULL DEFAULT 'file' CHECK (submission_type IN ('text', 'multiple_choice', 'file')),
ADD COLUMN IF NOT EXISTS questions jsonb,
ADD COLUMN IF NOT EXISTS attachment_url text,
ADD COLUMN IF NOT EXISTS attachment_name text;

-- Update submissions table to support text answers
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS answers jsonb;