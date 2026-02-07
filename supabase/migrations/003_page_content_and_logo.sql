-- ============================================
-- SAMATVAM LIVING — Page Content + Logo
-- Run this AFTER 002_seed_data.sql
-- ============================================

-- Add logo_url to settings
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Page Content table: stores editable text blocks for public pages
CREATE TABLE IF NOT EXISTS public.page_content (
  id TEXT PRIMARY KEY,
  page TEXT NOT NULL,           -- e.g. 'homepage', 'about', 'stories', 'how-it-works'
  section TEXT NOT NULL,        -- e.g. 'hero', 'intro', 'cta'
  field TEXT NOT NULL,          -- e.g. 'label', 'heading', 'subheading', 'body'
  value TEXT NOT NULL DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read page_content"
  ON public.page_content FOR SELECT
  USING (true);

CREATE POLICY "Admin manage page_content"
  ON public.page_content FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Updated_at trigger
CREATE TRIGGER update_page_content_updated_at
  BEFORE UPDATE ON public.page_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- SEED: Current hardcoded content from pages
-- ============================================

-- HOMEPAGE
INSERT INTO public.page_content (id, page, section, field, value, sort_order) VALUES
  ('hp-hero-line1', 'homepage', 'hero', 'line1', 'Eat clean.', 0),
  ('hp-hero-line2', 'homepage', 'hero', 'line2', 'Move more.', 1),
  ('hp-hero-line3', 'homepage', 'hero', 'line3', 'Sleep better.', 2),
  ('hp-hero-sub', 'homepage', 'hero', 'subheading', 'It sounds simple. And it is — if you have the right systems to support it.', 3),
  ('hp-hero-desc', 'homepage', 'hero', 'body', 'At Samatvam Living, we focus on building frameworks that make healthy habits easier to execute in real life — not harder.', 4),
  ('hp-hero-cta', 'homepage', 'hero', 'cta_text', 'Book a Discovery Call', 5),
  ('hp-hero-cta-url', 'homepage', 'hero', 'cta_url', 'contact.html', 6),
  ('hp-framework-label', 'homepage', 'framework', 'label', 'The Samatvam Living Framework', 0),
  ('hp-framework-heading', 'homepage', 'framework', 'heading', 'Health isn''t built in the gym. It''s built in the nervous system.', 1),
  ('hp-framework-body', 'homepage', 'framework', 'body', 'Most wellness programs start with food rules and workout plans. We start with your biology — specifically, your nervous system. Because until your body feels safe, no amount of discipline creates lasting change.', 2)
ON CONFLICT (id) DO NOTHING;

-- ABOUT PAGE
INSERT INTO public.page_content (id, page, section, field, value, sort_order) VALUES
  ('ab-hero-label', 'about', 'hero', 'label', 'About the Founders', 0),
  ('ab-hero-heading', 'about', 'hero', 'heading', 'We didn''t start this to become coaches.', 1),
  ('ab-hero-sub', 'about', 'hero', 'subheading', 'We started because our bodies broke. Then we rebuilt. Now we help others do the same.', 2)
ON CONFLICT (id) DO NOTHING;

-- STORIES PAGE
INSERT INTO public.page_content (id, page, section, field, value, sort_order) VALUES
  ('st-hero-label', 'stories', 'hero', 'label', 'Real Results', 0),
  ('st-hero-heading', 'stories', 'hero', 'heading', 'Quiet proof that the system works.', 1),
  ('st-hero-sub', 'stories', 'hero', 'subheading', 'Real people. Real transformations. No hype — just honest words from clients who rebuilt their health.', 2),
  ('st-stat1-number', 'stories', 'stats', 'stat1_number', '500+', 0),
  ('st-stat1-label', 'stories', 'stats', 'stat1_label', 'Clients helped', 1),
  ('st-stat2-number', 'stories', 'stats', 'stat2_number', '17 kg', 2),
  ('st-stat2-label', 'stories', 'stats', 'stat2_label', 'Best 3-month result', 3),
  ('st-stat3-number', 'stories', 'stats', 'stat3_number', '12+', 4),
  ('st-stat3-label', 'stories', 'stats', 'stat3_label', 'Countries', 5),
  ('st-cta-heading', 'stories', 'cta', 'heading', 'Your story starts here', 6),
  ('st-cta-sub', 'stories', 'cta', 'subheading', 'Every journey begins with a single conversation.', 7),
  ('st-cta-text', 'stories', 'cta', 'cta_text', 'Book a Discovery Call', 8)
ON CONFLICT (id) DO NOTHING;

-- HOW IT WORKS PAGE
INSERT INTO public.page_content (id, page, section, field, value, sort_order) VALUES
  ('hw-hero-label', 'how-it-works', 'hero', 'label', 'The Samatvam Living Framework', 0),
  ('hw-hero-heading', 'how-it-works', 'hero', 'heading', 'Restore. Nourish. Move.', 1),
  ('hw-hero-sub', 'how-it-works', 'hero', 'subheading', 'Modern life keeps you moving faster than your body can recover. We help you step out of autopilot and rebuild your health — in the right order.', 2),
  ('hw-problem-heading', 'how-it-works', 'problem', 'heading', 'Why most health advice fails', 3),
  ('hw-problem-body1', 'how-it-works', 'problem', 'body1', 'Most wellness advice starts with what to eat or how to exercise. But if your body is stuck in emergency mode, no amount of discipline will create lasting change.', 4),
  ('hw-problem-body2', 'how-it-works', 'problem', 'body2', 'Your body has a built-in priority system. When it senses danger — real or perceived — it redirects all resources to survival. Digestion slows. Sleep fragments. Fat storage increases. Willpower depletes.', 5),
  ('hw-problem-body3', 'how-it-works', 'problem', 'body3', 'This isn''t a character flaw. It''s biology. Samatvam starts where others skip — with getting your body out of survival mode first.', 6),
  ('hw-restore-heading', 'how-it-works', 'restore', 'heading', 'Fix your sleep. Manage your stress response.', 7),
  ('hw-restore-body', 'how-it-works', 'restore', 'body', 'Get your body out of "emergency mode". This is what most programs skip — and why they fail.', 8),
  ('hw-nourish-heading', 'how-it-works', 'nourish', 'heading', 'Eat for stable energy, not restriction', 9),
  ('hw-nourish-body', 'how-it-works', 'nourish', 'body', 'Eat in a way that supports stable energy, fewer cravings, and hormonal balance. Real food, real life — without restriction or obsession.', 10),
  ('hw-move-heading', 'how-it-works', 'move', 'heading', 'Build strength for the long game', 11),
  ('hw-move-body', 'how-it-works', 'move', 'body', 'Build strength that supports your body now and carries you confidently into your 60s, 70s, and beyond.', 12)
ON CONFLICT (id) DO NOTHING;

-- HOMEPAGE: Pillar Cards
INSERT INTO public.page_content (id, page, section, field, value, sort_order) VALUES
  ('hp-pillar-restore-desc', 'homepage', 'pillars', 'restore_desc', 'Fix your sleep. Manage your stress response. Get your body out of "emergency mode". This is what most programs skip, and why they fail.', 0),
  ('hp-pillar-nourish-desc', 'homepage', 'pillars', 'nourish_desc', 'Eat in a way that supports stable energy, fewer cravings, and hormonal balance. Real food, real life, without restriction or obsession.', 1),
  ('hp-pillar-move-desc', 'homepage', 'pillars', 'move_desc', 'Build strength that supports your body now and carries you confidently into your 60s, 70s, and beyond. Three pillars. One balanced life.', 2),
  ('hp-framework-closing', 'homepage', 'pillars', 'closing', 'Three pillars. One balanced life.', 3)
ON CONFLICT (id) DO NOTHING;

-- HOMEPAGE: Founders Section
INSERT INTO public.page_content (id, page, section, field, value, sort_order) VALUES
  ('hp-founders-label', 'homepage', 'founders', 'label', 'About The Founders', 0),
  ('hp-founders-title', 'homepage', 'founders', 'title', 'We''re Deepti and Hritwik', 1),
  ('hp-founders-sub', 'homepage', 'founders', 'subtitle', 'Two people who rebuilt our health from rock bottom and now help others do the same.', 2),
  ('hp-deepti-name', 'homepage', 'founders', 'deepti_name', 'Deepti''s Story', 3),
  ('hp-deepti-bio1', 'homepage', 'founders', 'deepti_bio1', 'At 34, I couldn''t walk up two flights of stairs without losing my breath. I was a high-performing corporate leader who looked fine on the outside, but inside, I was falling apart.', 4),
  ('hp-deepti-bio2', 'homepage', 'founders', 'deepti_bio2', 'After 20 years in the corporate world, I left to rebuild my health and help others who were exactly where I''d been: exhausted, gaining weight, and stuck.', 5),
  ('hp-deepti-bio3', 'homepage', 'founders', 'deepti_bio3', 'Today at 42, I run half marathons, can do headstands, and have the energy to live the life I always wanted.', 6),
  ('hp-deepti-creds', 'homepage', 'founders', 'deepti_creds', 'NASM Certified Nutrition Coach | Certified Yoga Teacher (Sivananda Ashram)', 7),
  ('hp-hritwik-name', 'homepage', 'founders', 'hritwik_name', 'Hritwik''s Story', 8),
  ('hp-hritwik-bio1', 'homepage', 'founders', 'hritwik_bio1', 'For years, I struggled with psoriasis, IBS, and anxiety: conditions that left me searching for answers conventional medicine couldn''t provide. I became my own experiment, diving deep into nutrition science and holistic wellness.', 9),
  ('hp-hritwik-bio2', 'homepage', 'founders', 'hritwik_bio2', 'I wasn''t trying to become a coach. I was trying to heal myself. It worked. Since then, I''ve helped over 500 people improve their health, lose weight, and break free from cycles that never solved the root problem.', 10),
  ('hp-hritwik-creds', 'homepage', 'founders', 'hritwik_creds', 'Precision Nutrition Level 1 Coach | Yoga Siromani (YVFA)', 11),
  ('hp-mission-title', 'homepage', 'founders', 'mission_title', 'Together, we built Samatvam Living', 12),
  ('hp-mission-text', 'homepage', 'founders', 'mission_text', 'A practical, science-backed approach for high-performing professionals who need their health to support their life goals — without turning it into another project.', 13),
  ('hp-mission-sub', 'homepage', 'founders', 'mission_sub', 'We work with real people living real lives, helping them build sustainable health that fits their actual circumstances.', 14)
ON CONFLICT (id) DO NOTHING;

-- HOMEPAGE: Offerings Section
INSERT INTO public.page_content (id, page, section, field, value, sort_order) VALUES
  ('hp-offerings-label', 'homepage', 'offerings', 'label', 'Choose the support that fits your life', 0),
  ('hp-offerings-title', 'homepage', 'offerings', 'title', 'Offerings', 1),
  ('hp-off1-title', 'homepage', 'offerings', 'off1_title', 'One-on-One Coaching', 2),
  ('hp-off1-subtitle', 'homepage', 'offerings', 'off1_subtitle', 'Personalized. Practical. Built for real life.', 3),
  ('hp-off1-desc', 'homepage', 'offerings', 'off1_desc', 'You''ve tried the meal plans, workout programs, and apps. The problem wasn''t the plan — it was your body fighting against you.', 4),
  ('hp-off1-price', 'homepage', 'offerings', 'off1_price', '$900 / ₹75,000', 5),
  ('hp-off2-title', 'homepage', 'offerings', 'off2_title', 'Small Group Cohort', 6),
  ('hp-off2-subtitle', 'homepage', 'offerings', 'off2_subtitle', 'Community. Accountability. Systems that stick.', 7),
  ('hp-off2-desc', 'homepage', 'offerings', 'off2_desc', 'The same framework as 1:1 coaching, but with a small group of 3–5 peers who share your challenges.', 8),
  ('hp-off2-price', 'homepage', 'offerings', 'off2_price', '$400 / ₹35,000', 9),
  ('hp-off3-title', 'homepage', 'offerings', 'off3_title', 'Corporate Workshops', 10),
  ('hp-off3-subtitle', 'homepage', 'offerings', 'off3_subtitle', 'Performance Without Burnout', 11),
  ('hp-off3-desc', 'homepage', 'offerings', 'off3_desc', 'Evidence-based science applied to workplace performance. Help your team sustain performance without burning out.', 12),
  ('hp-off3-price', 'homepage', 'offerings', 'off3_price', 'Custom pricing', 13),
  ('hp-off4-title', 'homepage', 'offerings', 'off4_title', '14-Day Habit Masterclass', 14),
  ('hp-off4-subtitle', 'homepage', 'offerings', 'off4_subtitle', 'Self-Paced. Build Habits That Stick.', 15),
  ('hp-off4-desc', 'homepage', 'offerings', 'off4_desc', 'Build one sustainable health habit at a time using our proven framework. Self-paced and accessible.', 16),
  ('hp-off4-price', 'homepage', 'offerings', 'off4_price', 'Coming soon', 17)
ON CONFLICT (id) DO NOTHING;

-- HOMEPAGE: Testimonials Section
INSERT INTO public.page_content (id, page, section, field, value, sort_order) VALUES
  ('hp-testi-label', 'homepage', 'testimonials', 'label', 'Testimonials', 0),
  ('hp-testi-title', 'homepage', 'testimonials', 'title', 'Stories of Transformation', 1)
ON CONFLICT (id) DO NOTHING;

-- HOMEPAGE: Final CTA
INSERT INTO public.page_content (id, page, section, field, value, sort_order) VALUES
  ('hp-cta-title', 'homepage', 'cta', 'title', 'Ready to transform?', 0),
  ('hp-cta-sub', 'homepage', 'cta', 'subtitle', 'Your journey to optimal health and performance starts with a single conversation. Let''s define your path forward.', 1),
  ('hp-cta-btn', 'homepage', 'cta', 'cta_text', 'Book Your Discovery Call', 2),
  ('hp-cta-email', 'homepage', 'cta', 'email_text', 'Questions? Email us at deepti@samatvam.living', 3)
ON CONFLICT (id) DO NOTHING;

-- STORIES: Individual Story Cards
INSERT INTO public.page_content (id, page, section, field, value, sort_order) VALUES
  ('st-s1-badge', 'stories', 'story1', 'badge', 'Featured Transformation', 0),
  ('st-s1-result', 'stories', 'story1', 'result', '-20 kg in 5 months', 1),
  ('st-s1-quote', 'stories', 'story1', 'quote', 'This was more than just weight loss — it was a complete lifestyle transformation. His holistic approach and constant support made a huge difference, helping me achieve balance physically, emotionally, and mentally.', 2),
  ('st-s1-before', 'stories', 'story1', 'before', 'Chronic fatigue, stress eating, poor sleep', 3),
  ('st-s1-after', 'stories', 'story1', 'after', 'Lost 20 kg, balanced energy, lasting habits', 4),
  ('st-s1-author', 'stories', 'story1', 'author', 'Myraa', 5),
  ('st-s1-role', 'stories', 'story1', 'role', 'Chartered Accountant', 6),
  ('st-s2-badge', 'stories', 'story2', 'badge', 'Couple Transformation', 7),
  ('st-s2-result', 'stories', 'story2', 'result', '-17 kg in 3 months', 8),
  ('st-s2-quote', 'stories', 'story2', 'quote', 'He took the stress out of the entire programme so this was not just a diet plan. He focuses on being happy and content throughout the journey.', 9),
  ('st-s2-before', 'stories', 'story2', 'before', 'Multiple failed diets, stressful food relationship', 10),
  ('st-s2-after', 'stories', 'story2', 'after', '17 kg lost together, happy approach to food', 11),
  ('st-s2-author', 'stories', 'story2', 'author', 'Dhruvi & Ankit', 12),
  ('st-s2-role', 'stories', 'story2', 'role', 'Financial Analysts', 13),
  ('st-s3-badge', 'stories', 'story3', 'badge', 'Health Overhaul', 14),
  ('st-s3-result', 'stories', 'story3', 'result', '-7 kg · Thyroid improved', 15),
  ('st-s3-quote', 'stories', 'story3', 'quote', 'Working with Hritwik for four months has been transformative. I have lost 7 kg, improved my health, and adopted sustainable habits.', 16),
  ('st-s3-before', 'stories', 'story3', 'before', 'Thyroid imbalance, high sugar, poor sleep', 17),
  ('st-s3-after', 'stories', 'story3', 'after', 'Thyroid improved, 7 kg lost, better energy', 18),
  ('st-s3-author', 'stories', 'story3', 'author', 'Disha Jain', 19),
  ('st-s3-role', 'stories', 'story3', 'role', 'Actuary', 20),
  ('st-s4-badge', 'stories', 'story4', 'badge', 'Adaptive Transformation', 21),
  ('st-s4-result', 'stories', 'story4', 'result', '-7 kg · Paraplegic client', 22),
  ('st-s4-quote', 'stories', 'story4', 'quote', 'Working with Hritwik has been life-changing. Despite being a paraplegic, I lost 7 kg in six months. I feel more energetic, less hungry, and free from unhealthy cravings.', 23),
  ('st-s4-before', 'stories', 'story4', 'before', 'Weight gain with limited mobility, cravings', 24),
  ('st-s4-after', 'stories', 'story4', 'after', '7 kg lost, more energy, no cravings', 25),
  ('st-s4-author', 'stories', 'story4', 'author', 'Adeep Jain', 26),
  ('st-s4-role', 'stories', 'story4', 'role', 'Actuary', 27),
  ('st-s5-badge', 'stories', 'story5', 'badge', 'Long-term Recovery', 28),
  ('st-s5-result', 'stories', 'story5', 'result', '-10+ kg · Thyroid normalized', 29),
  ('st-s5-quote', 'stories', 'story5', 'quote', 'After years of gut issues, acidity, weight gain, and thyroid imbalance, this program completely changed my health. Thyroid levels normalized, and I lost over 10 kg.', 30),
  ('st-s5-before', 'stories', 'story5', 'before', 'Chronic gut issues, thyroid imbalance, antacids', 31),
  ('st-s5-after', 'stories', 'story5', 'after', 'Gut healed, thyroid normal, 10+ kg lost', 32),
  ('st-s5-author', 'stories', 'story5', 'author', 'Reetika Jain', 33),
  ('st-s5-role', 'stories', 'story5', 'role', 'Age 46 · Middle East', 34)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- IMAGES & VIDEOS
-- ============================================

-- HOMEPAGE: Founder Images
INSERT INTO public.page_content (id, page, section, field, value, sort_order) VALUES
  ('hp-deepti-img', 'homepage', 'founders', 'deepti_img', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80', 20),
  ('hp-hritwik-img', 'homepage', 'founders', 'hritwik_img', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80', 21)
ON CONFLICT (id) DO NOTHING;

-- ABOUT PAGE: Founder Images
INSERT INTO public.page_content (id, page, section, field, value, sort_order) VALUES
  ('ab-deepti-img', 'about', 'founders', 'deepti_img', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80', 10),
  ('ab-hritwik-img', 'about', 'founders', 'hritwik_img', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', 11)
ON CONFLICT (id) DO NOTHING;

-- HOW IT WORKS: Pillar Images
INSERT INTO public.page_content (id, page, section, field, value, sort_order) VALUES
  ('hw-restore-img', 'how-it-works', 'restore', 'image', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80', 20),
  ('hw-nourish-img', 'how-it-works', 'nourish', 'image', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80', 20),
  ('hw-move-img', 'how-it-works', 'move', 'image', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80', 20)
ON CONFLICT (id) DO NOTHING;

-- STORIES: Before/After Images + Video URLs
-- (Empty strings as placeholders — admin can paste real URLs)
INSERT INTO public.page_content (id, page, section, field, value, sort_order) VALUES
  ('st-s1-img-before', 'stories', 'story1', 'img_before', '', 40),
  ('st-s1-img-after', 'stories', 'story1', 'img_after', '', 41),
  ('st-s1-video', 'stories', 'story1', 'video_url', '', 42),
  ('st-s2-img-before', 'stories', 'story2', 'img_before', '', 40),
  ('st-s2-img-after', 'stories', 'story2', 'img_after', '', 41),
  ('st-s2-video', 'stories', 'story2', 'video_url', '', 42),
  ('st-s3-img-before', 'stories', 'story3', 'img_before', '', 40),
  ('st-s3-img-after', 'stories', 'story3', 'img_after', '', 41),
  ('st-s3-video', 'stories', 'story3', 'video_url', '', 42),
  ('st-s4-img-before', 'stories', 'story4', 'img_before', '', 40),
  ('st-s4-img-after', 'stories', 'story4', 'img_after', '', 41),
  ('st-s4-video', 'stories', 'story4', 'video_url', '', 42),
  ('st-s5-img-before', 'stories', 'story5', 'img_before', '', 40),
  ('st-s5-img-after', 'stories', 'story5', 'img_after', '', 41),
  ('st-s5-video', 'stories', 'story5', 'video_url', '', 42)
ON CONFLICT (id) DO NOTHING;

-- HOMEPAGE: Testimonial carousel before/after + video (used by home.js)
INSERT INTO public.page_content (id, page, section, field, value, sort_order) VALUES
  ('hp-testi-s1-img-before', 'homepage', 'testimonials', 'story1_img_before', '', 10),
  ('hp-testi-s1-img-after', 'homepage', 'testimonials', 'story1_img_after', '', 11),
  ('hp-testi-s1-video', 'homepage', 'testimonials', 'story1_video', '', 12)
ON CONFLICT (id) DO NOTHING;
