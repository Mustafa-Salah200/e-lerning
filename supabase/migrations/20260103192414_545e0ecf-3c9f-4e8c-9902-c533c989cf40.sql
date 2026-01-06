-- Create role enum for users
CREATE TYPE public.user_role AS ENUM ('student', 'teacher');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  details TEXT,
  category TEXT,
  thumbnail_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_enrollments table (students joining courses)
CREATE TABLE public.course_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress INTEGER NOT NULL DEFAULT 0,
  UNIQUE(course_id, student_id)
);

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignment_type TEXT NOT NULL DEFAULT 'file', -- 'file' or 'multiple_choice'
  options JSONB, -- For multiple choice questions: [{option: "A", text: "Answer A"}, ...]
  correct_answer TEXT, -- For multiple choice
  due_date TIMESTAMP WITH TIME ZONE,
  max_score INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answer TEXT, -- For multiple choice or text answer
  file_url TEXT, -- For file uploads
  file_name TEXT,
  score INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  graded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(assignment_id, student_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own role"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Courses policies
CREATE POLICY "Anyone can view published courses"
  ON public.courses FOR SELECT
  USING (is_published = true OR teacher_id = auth.uid());

CREATE POLICY "Teachers can create courses"
  ON public.courses FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'teacher') AND teacher_id = auth.uid());

CREATE POLICY "Teachers can update own courses"
  ON public.courses FOR UPDATE
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own courses"
  ON public.courses FOR DELETE
  USING (teacher_id = auth.uid());

-- Course enrollments policies
CREATE POLICY "Students can view own enrollments"
  ON public.course_enrollments FOR SELECT
  USING (student_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.courses WHERE id = course_id AND teacher_id = auth.uid()
  ));

CREATE POLICY "Students can enroll in courses"
  ON public.course_enrollments FOR INSERT
  WITH CHECK (student_id = auth.uid() AND public.has_role(auth.uid(), 'student'));

CREATE POLICY "Students can update own enrollment progress"
  ON public.course_enrollments FOR UPDATE
  USING (student_id = auth.uid());

-- Assignments policies
CREATE POLICY "Enrolled students and teachers can view assignments"
  ON public.assignments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.course_enrollments WHERE course_id = assignments.course_id AND student_id = auth.uid())
  );

CREATE POLICY "Teachers can create assignments"
  ON public.assignments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.courses WHERE id = course_id AND teacher_id = auth.uid()
  ));

CREATE POLICY "Teachers can update assignments"
  ON public.assignments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.courses WHERE id = course_id AND teacher_id = auth.uid()
  ));

CREATE POLICY "Teachers can delete assignments"
  ON public.assignments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.courses WHERE id = course_id AND teacher_id = auth.uid()
  ));

-- Submissions policies
CREATE POLICY "Students can view own submissions"
  ON public.submissions FOR SELECT
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.courses c ON a.course_id = c.id
      WHERE a.id = assignment_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can submit assignments"
  ON public.submissions FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own submissions before grading"
  ON public.submissions FOR UPDATE
  USING (student_id = auth.uid() AND graded_at IS NULL);

CREATE POLICY "Teachers can grade submissions"
  ON public.submissions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.courses c ON a.course_id = c.id
    WHERE a.id = assignment_id AND c.teacher_id = auth.uid()
  ));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for assignment files
INSERT INTO storage.buckets (id, name, public) VALUES ('assignment-files', 'assignment-files', true);

-- Storage policies for assignment files
CREATE POLICY "Anyone can view assignment files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'assignment-files');

CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'assignment-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'assignment-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'assignment-files' AND auth.uid()::text = (storage.foldername(name))[1]);