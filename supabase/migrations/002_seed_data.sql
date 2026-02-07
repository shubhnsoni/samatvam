-- ============================================
-- SAMATVAM LIVING — Seed Data
-- Run this AFTER 001_initial_schema.sql
-- ============================================

-- Programs
INSERT INTO public.programs (id, title, duration, status, ideal_for, format, url) VALUES
  ('prog-1', 'One-on-One Coaching', '12 Weeks', 'waitlist', 'High-performing executives', 'Weekly 1:1 Sessions', 'program-coaching.html'),
  ('prog-2', 'Small Group Cohort', '8 Weeks', 'open', 'Those seeking community', 'Weekly Group Sessions', 'program-cohort.html'),
  ('prog-3', 'Corporate Workshops', 'Custom', 'inquire', 'Teams & Organizations', 'On-site or Virtual', 'program-corporate.html'),
  ('prog-4', '14-Day Habit Masterclass', '14 Days', 'open', 'Self-starters', 'Self-Paced + Daily Guidance', 'program-masterclass.html')
ON CONFLICT (id) DO NOTHING;

-- Testimonials
INSERT INTO public.testimonials (id, quote, context, author, program, display_on) VALUES
  ('test-1', 'The Samatvam framework completely changed how I approach my health. For the first time, I''m not fighting myself.', 'After 15 years in corporate finance, Priya''s health had become an afterthought.', 'Priya M.', '1:1 Coaching', ARRAY['homepage', 'stories']),
  ('test-2', 'I was skeptical. But within three weeks, my sleep improved, my cravings dropped, and I stopped dreading mornings.', 'Arjun had tried every diet and fitness program available.', 'Arjun K.', 'Group Cohort', ARRAY['homepage', 'stories']),
  ('test-3', 'This isn''t another wellness program. It''s the first one that actually made sense to my body — not just my mind.', 'Meera joined the Habit Masterclass expecting another set of rules.', 'Meera S.', 'Masterclass', ARRAY['homepage', 'stories'])
ON CONFLICT (id) DO NOTHING;

-- Founders
INSERT INTO public.founders (id, name, role, quote, bio, certifications, sort_order) VALUES
  ('founder-1', 'Deepti', 'Co-Founder', 'We didn''t start this to become coaches. We started because our bodies broke.', 'After years of high-performance corporate life, my nervous system simply shut down. Samatvam is the system I wish I had.', 'MSc Physiology, NSDR Certified', 0),
  ('founder-2', 'Hritwik', 'Co-Founder', 'I realized that discipline wasn''t the missing ingredient. Safety was. When the body feels safe, health is natural.', 'A decade in fitness taught me everything about pushing harder. Samatvam taught me when to stop pushing and start listening.', 'NASM-CPT, Precision Nutrition L2', 1)
ON CONFLICT (id) DO NOTHING;

-- Resources
INSERT INTO public.resources (id, title, type, duration, phase, program, description, url) VALUES
  ('res-1', 'NSDR Protocol', 'video', '20 min', 'restore', 'all', 'A guided non-sleep deep rest protocol.', 'https://www.youtube.com/watch?v=example1'),
  ('res-2', 'Evening Wind-Down Guide', 'pdf', '4 pages', 'restore', 'all', 'Step-by-step guide to building your evening ritual.', 'https://drive.google.com/file/d/example2'),
  ('res-3', 'Sleep Architecture Tracker', 'worksheet', NULL, 'restore', 'all', 'Track your sleep patterns.', 'https://drive.google.com/file/d/example3'),
  ('res-4', 'Box Breathing Tutorial', 'video', '12 min', 'restore', 'all', 'Breathing technique for parasympathetic activation.', 'https://www.youtube.com/watch?v=example4'),
  ('res-5', 'Blood Sugar Stabilization Guide', 'pdf', NULL, 'nourish', 'all', 'Understanding and managing blood sugar.', 'https://drive.google.com/file/d/example5'),
  ('res-6', 'Mindful Eating Practice', 'video', '15 min', 'nourish', 'all', 'Reconnecting with hunger signals.', 'https://www.youtube.com/watch?v=example6'),
  ('res-7', 'Functional Stretching Routine', 'video', '25 min', 'move', 'all', 'Daily stretching for desk workers.', 'https://www.youtube.com/watch?v=example7')
ON CONFLICT (id) DO NOTHING;

-- Focus Templates
INSERT INTO public.focus_templates (id, title, phase, description, why_it_matters, good_enough) VALUES
  ('focus-1', 'Sleep Time Consistency', 'restore', 'Go to bed within the same 30-minute window each night.', 'Consistent sleep timing helps regulate your circadian rhythm.', 'Hit your target window 5 out of 7 nights.'),
  ('focus-2', 'Morning Light Exposure', 'restore', 'Get 10 minutes of natural light within 30 minutes of waking.', 'Morning light resets your circadian clock and boosts cortisol at the right time.', 'Step outside or sit by a window most mornings.'),
  ('focus-3', 'Evening Wind-Down Ritual', 'restore', 'Create a 30-minute buffer between last screen and sleep.', 'Signals safety to your nervous system before bed.', 'Screens off 30 minutes before bed, most nights.'),
  ('focus-4', 'Breathing Protocol', 'restore', 'Practice box breathing for 5 minutes daily.', 'Activates the parasympathetic nervous system.', '5 minutes, once a day.'),
  ('focus-5', 'Blood Sugar Stabilization', 'nourish', 'Eat protein within 1 hour of waking.', 'Stabilizes blood sugar and reduces cravings.', 'Protein at breakfast most days.'),
  ('focus-6', 'Daily Walking', 'move', '20-minute walk daily, preferably outdoors.', 'Low-intensity movement supports nervous system recovery.', '15-20 minutes, most days.')
ON CONFLICT (id) DO NOTHING;

-- Blog Posts
INSERT INTO public.blog_posts (id, title, category, status, excerpt, body) VALUES
  ('blog-1', 'Why Sleep Is the Foundation of Health', 'Sleep Science', 'draft', 'Understanding why sleep is the first pillar of the Samatvam framework.', ''),
  ('blog-2', 'The Nervous System Reset: What It Actually Means', 'Nervous System', 'draft', 'Demystifying nervous system regulation and why it matters.', ''),
  ('blog-3', 'Blood Sugar and Energy: The Missing Link', 'Nutrition', 'draft', 'How blood sugar stability affects your energy, mood, and cravings.', '')
ON CONFLICT (id) DO NOTHING;

-- Settings (singleton)
INSERT INTO public.settings (id, site_name, contact_email, whatsapp_number, footer_tagline, features, program_availability) VALUES
  ('settings', 'Samatvam Living', 'hello@samatvam.com', '+91 98765 43210', 'Balance isn''t something you achieve. It''s something you return to — again and again.',
   '{"blog": false, "selfRegistration": false, "inAppMessaging": true}',
   '{"coaching": true, "cohort": true, "corporate": true, "masterclass": true}')
ON CONFLICT (id) DO NOTHING;

-- Courses with lessons (JSONB)
INSERT INTO public.courses (id, title, phase, description, lessons) VALUES
  ('course-1', 'Sleep & Nervous System', 'restore', 'Understand how sleep and your nervous system work together. Learn practical protocols to restore deep rest.',
   '[
     {"id": "les-1a", "title": "Why Sleep Is the Foundation", "type": "video", "duration": "12 min", "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "description": "Explore why sleep is the first pillar of the Samatvam framework and how it affects every system in your body.", "coachTip": "Don''t try to fix everything at once. Just notice your current sleep patterns this week."},
     {"id": "les-1b", "title": "Your Circadian Rhythm", "type": "video", "duration": "15 min", "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "description": "How light, temperature, and timing regulate your internal clock.", "coachTip": "Morning light within 30 minutes of waking is the single most impactful habit."},
     {"id": "les-1c", "title": "NSDR Protocol", "type": "video", "duration": "20 min", "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "description": "A guided non-sleep deep rest session to downregulate your nervous system."},
     {"id": "les-1d", "title": "Building Your Evening Ritual", "type": "reading", "duration": "5 min read", "description": "A step-by-step guide to creating a wind-down routine that signals safety to your body.", "content": "Start by choosing a consistent time to begin winding down — ideally 30-60 minutes before your target sleep time. Dim the lights, put screens away, and choose one calming activity: gentle stretching, journaling, or breathwork. The key is consistency, not perfection."}
   ]'::jsonb),
  ('course-2', 'Blood Sugar & Energy', 'nourish', 'Learn how blood sugar stability affects your energy, mood, and cravings. Build sustainable nutrition habits.',
   '[
     {"id": "les-2a", "title": "Blood Sugar 101", "type": "video", "duration": "14 min", "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "description": "Understanding the glucose curve and why it matters for energy and mood."},
     {"id": "les-2b", "title": "The Protein-First Breakfast", "type": "video", "duration": "10 min", "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "description": "Why eating protein within an hour of waking stabilizes your entire day.", "coachTip": "Aim for 20-30g protein at breakfast. Eggs, Greek yogurt, or a protein smoothie all work."},
     {"id": "les-2c", "title": "Mindful Eating Practice", "type": "video", "duration": "15 min", "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "description": "Reconnect with your body''s hunger and fullness signals."}
   ]'::jsonb),
  ('course-3', 'Functional Movement', 'move', 'Introduce movement at the right intensity for your capacity. Strength that supports your future.',
   '[
     {"id": "les-3a", "title": "Why Walking Is Enough", "type": "video", "duration": "8 min", "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "description": "The science behind low-intensity movement and nervous system recovery."},
     {"id": "les-3b", "title": "Daily Stretching Routine", "type": "video", "duration": "25 min", "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "description": "A full-body stretching routine designed for desk workers.", "coachTip": "Do this first thing in the morning or right after work. Consistency beats intensity."},
     {"id": "les-3c", "title": "Strength Foundations", "type": "video", "duration": "20 min", "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "description": "Basic bodyweight strength exercises to build a sustainable movement practice."}
   ]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Clients (demo data)
INSERT INTO public.clients (id, name, email, phone, program, phase, week, total_weeks, status, coach, enrolled_date, last_active) VALUES
  ('client-1', 'Priya Mehta', 'priya@example.com', '+91 98765 43210', '1:1 Coaching', 'restore', 3, 12, 'active', 'Deepti', '2026-01-15', 'Today'),
  ('client-2', 'Arjun Kumar', 'arjun@example.com', NULL, 'Group Cohort', 'nourish', 5, 8, 'active', 'Hritwik', '2026-01-08', 'Yesterday'),
  ('client-3', 'Meera Sharma', 'meera@example.com', NULL, 'Masterclass', 'move', 12, 14, 'active', 'Deepti', '2026-01-20', '2 days ago'),
  ('client-4', 'Rahul Desai', 'rahul@example.com', NULL, '1:1 Coaching', 'restore', 2, 12, 'paused', 'Deepti', '2026-01-22', '5 days ago'),
  ('client-5', 'Ananya Rao', 'ananya@example.com', NULL, '1:1 Coaching', 'nourish', 12, 12, 'completed', 'Hritwik', '2025-11-01', '1 week ago')
ON CONFLICT (id) DO NOTHING;

-- Lesson Progress (demo data)
INSERT INTO public.lesson_progress (client_id, lesson_id, completed, watched_seconds, last_watched) VALUES
  ('client-1', 'les-1a', true, 720, '2026-02-03T10:00:00.000Z'),
  ('client-1', 'les-1b', true, 900, '2026-02-05T09:30:00.000Z'),
  ('client-1', 'les-1c', false, 480, '2026-02-06T20:15:00.000Z');
