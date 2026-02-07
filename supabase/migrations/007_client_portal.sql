-- ============================================
-- SAMATVAM LIVING — Client Portal Enhancements
-- Run AFTER 006_testimonials_media.sql
-- ============================================

-- 1. Reflections table for client journal entries
CREATE TABLE IF NOT EXISTS public.reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT REFERENCES public.clients(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week INT DEFAULT 1,
  focus_title TEXT DEFAULT '',
  sleep TEXT DEFAULT '',
  energy TEXT DEFAULT '',
  hard TEXT DEFAULT '',
  good TEXT DEFAULT '',
  coach_feedback TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

-- Clients can view their own reflections
CREATE POLICY "Clients can view own reflections"
  ON public.reflections FOR SELECT
  USING (auth_user_id = auth.uid());

-- Clients can insert their own reflections
CREATE POLICY "Clients can insert own reflections"
  ON public.reflections FOR INSERT
  WITH CHECK (auth_user_id = auth.uid());

-- Clients can update their own reflections
CREATE POLICY "Clients can update own reflections"
  ON public.reflections FOR UPDATE
  USING (auth_user_id = auth.uid());

-- Admins can do everything with reflections
CREATE POLICY "Admins manage reflections"
  ON public.reflections FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_reflections_updated_at
  BEFORE UPDATE ON public.reflections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2. Add client RLS for lesson_progress (clients can read/write their own)
CREATE POLICY "Clients can view own lesson progress"
  ON public.lesson_progress FOR SELECT
  USING (
    client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Clients can insert own lesson progress"
  ON public.lesson_progress FOR INSERT
  WITH CHECK (
    client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Clients can update own lesson progress"
  ON public.lesson_progress FOR UPDATE
  USING (
    client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
  );

-- 3. Add assigned_focus field to clients table (links to focus_templates)
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS assigned_focus TEXT DEFAULT '';
