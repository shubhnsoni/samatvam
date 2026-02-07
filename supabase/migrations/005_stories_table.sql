-- ============================================
-- SAMATVAM LIVING — Stories Table
-- Stores transformation stories with full CRUD
-- Run this AFTER 004_storage_bucket.sql
-- ============================================

CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge TEXT NOT NULL DEFAULT '',
  result TEXT NOT NULL DEFAULT '',
  quote TEXT NOT NULL DEFAULT '',
  before_text TEXT NOT NULL DEFAULT '',
  after_text TEXT NOT NULL DEFAULT '',
  author_name TEXT NOT NULL DEFAULT '',
  author_role TEXT NOT NULL DEFAULT '',
  img_before TEXT DEFAULT '',
  img_after TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  featured BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read stories"
  ON public.stories FOR SELECT
  USING (true);

CREATE POLICY "Admin manage stories"
  ON public.stories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Updated_at trigger
CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- SEED: Migrate existing hardcoded stories
-- ============================================

INSERT INTO public.stories (badge, result, quote, before_text, after_text, author_name, author_role, featured, sort_order) VALUES
  ('Featured Transformation', '-20 kg in 5 months', 'This was more than just weight loss — it was a complete lifestyle transformation. His holistic approach and constant support made a huge difference, helping me achieve balance physically, emotionally, and mentally.', 'Chronic fatigue, stress eating, poor sleep', 'Lost 20 kg, balanced energy, lasting habits', 'Myraa', 'Chartered Accountant', true, 0),
  ('Couple Transformation', '-17 kg in 3 months', 'He took the stress out of the entire programme so this was not just a diet plan. He focuses on being happy and content throughout the journey.', 'Multiple failed diets, stressful food relationship', '17 kg lost together, happy approach to food', 'Dhruvi & Ankit', 'Financial Analysts', false, 1),
  ('Health Overhaul', '-7 kg · Thyroid improved', 'Working with Hritwik for four months has been transformative. I have lost 7 kg, improved my health, and adopted sustainable habits.', 'Thyroid imbalance, high sugar, poor sleep', 'Thyroid improved, 7 kg lost, better energy', 'Disha Jain', 'Actuary', false, 2),
  ('Adaptive Transformation', '-7 kg · Paraplegic client', 'Working with Hritwik has been life-changing. Despite being a paraplegic, I lost 7 kg in six months. I feel more energetic, less hungry, and free from unhealthy cravings.', 'Weight gain with limited mobility, cravings', '7 kg lost, more energy, no cravings', 'Adeep Jain', 'Actuary', false, 3),
  ('Long-term Recovery', '-10+ kg · Thyroid normalized', 'After years of gut issues, acidity, weight gain, and thyroid imbalance, this program completely changed my health. Thyroid levels normalized, and I lost over 10 kg.', 'Chronic gut issues, thyroid imbalance, antacids', 'Gut healed, thyroid normal, 10+ kg lost', 'Reetika Jain', 'Age 46 · Middle East', false, 4);
