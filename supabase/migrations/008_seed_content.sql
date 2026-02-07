-- ============================================
-- SAMATVAM LIVING — Seed Real Content
-- Stories, Testimonials, Blog Posts, Founders, Programs
-- Run AFTER all previous migrations
-- ============================================

-- =============================================
-- 0. ADD MISSING COLUMNS
-- =============================================
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS result TEXT DEFAULT '';
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS img_before TEXT DEFAULT '';
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS img_after TEXT DEFAULT '';
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '';

ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- =============================================
-- 1. UPDATE PROGRAMS with revised copy
-- =============================================
UPDATE public.programs SET
  description = 'Personalized. Practical. Built for real life. Weekly 1:1 calls, daily WhatsApp accountability, real-time adjustments.',
  duration = '12 Weeks',
  status = 'open',
  ideal_for = 'High-performing professionals who need their health to support their life goals',
  sort_order = 0
WHERE id = 'prog-1';

UPDATE public.programs SET
  description = 'Community. Accountability. Systems that stick. Same framework, small group of 3-5 people.',
  duration = '12 Weeks',
  status = 'open',
  ideal_for = 'Those who want structure and community without 1:1 attention',
  sort_order = 1
WHERE id = 'prog-2';

UPDATE public.programs SET
  description = 'Performance Without Burnout: A Science-Based Approach. Evidence-based science applied to workplace performance.',
  duration = '90 mins / Custom',
  status = 'inquire',
  ideal_for = 'Teams & Organizations',
  sort_order = 2
WHERE id = 'prog-3';

UPDATE public.programs SET
  description = 'Self-Paced. Build Healthy Habits That Actually Stick. Using the same framework from our coaching programs.',
  duration = '14 Days · Self-Paced',
  status = 'waitlist',
  ideal_for = 'Self-starters ready to build one sustainable habit at a time',
  sort_order = 3
WHERE id = 'prog-4';

-- =============================================
-- 2. UPDATE FOUNDERS with revised bios
-- =============================================
UPDATE public.founders SET
  quote = 'At 34, I couldn''t walk up two flights of stairs without losing my breath.',
  bio = 'I was a high-performing corporate leader who looked fine on the outside, but inside, I was falling apart. After 20 years in the corporate world, I left to rebuild my health and help others who were exactly where I''d been: exhausted, gaining weight, and stuck. Today at 42, I run half marathons, can do headstands, and have the energy to live the life I always wanted.',
  certifications = 'NASM Certified Nutrition Coach | Certified Yoga Teacher (Sivananda Ashram)'
WHERE id = 'founder-1';

UPDATE public.founders SET
  quote = 'I wasn''t trying to become a coach. I was trying to heal myself. It worked.',
  bio = 'For years, I struggled with psoriasis, IBS, and anxiety — conditions that left me searching for answers conventional medicine couldn''t provide. I became my own experiment, diving deep into nutrition science and holistic wellness. Since then, I''ve helped over 500 people improve their health, lose weight, and break free from cycles that never solved the root problem.',
  certifications = 'Precision Nutrition Level 1 Coach | Yoga Siromani (YVFA)'
WHERE id = 'founder-2';

-- =============================================
-- 3. REPLACE TESTIMONIALS with real client data
-- =============================================
DELETE FROM public.testimonials WHERE id IN ('test-1', 'test-2', 'test-3');

INSERT INTO public.testimonials (id, quote, context, author, program, result, display_on, sort_order) VALUES
  ('test-1',
   'He took the stress out of the entire programme so this was not just a diet plan. He focuses on being happy and content throughout the journey, which is something which we haven''t seen with other coaches before, and we''ve known coaches to be uber pushy, especially when it comes to achieving a goal — this was not the case with Hritwik.',
   'Dhruvi and Ankit worked with Hritwik on a complete lifestyle transformation.',
   'Dhruvi and Ankit',
   '1:1 Coaching',
   'Lost 17 kgs in 3 months',
   ARRAY['homepage', 'stories'],
   0),
  ('test-2',
   'Working with Hritwik for four months has been transformative. I have lost 7 kg, improved my health, and adopted sustainable habits. His flexible approach focuses on fat loss, muscle gain, and practical nutrition, while incorporating mindfulness practices like pranayama and yoga. With his guidance, I''ve improved thyroid function, reduced sugar intake, and enhanced my energy, immunity, skin, hair, and sleep quality.',
   'Disha joined seeking a holistic approach to health improvement.',
   'Disha Jain',
   '1:1 Coaching',
   'Lost 7 kg, improved thyroid function',
   ARRAY['homepage', 'stories'],
   1),
  ('test-3',
   'Working with Hritwik has been life-changing. Despite being a paraplegic, I lost 7 kg in six months, thanks to his tailored nutrition plan and logical guidance. I feel more energetic, less hungry, and free from unhealthy cravings. His comprehensive framework empowers sustainable changes, and his approachable nature makes the journey even better.',
   'Adeep overcame unique physical challenges with a tailored approach.',
   'Adeep Jain',
   '1:1 Coaching',
   'Lost 7 kg in 6 months',
   ARRAY['homepage', 'stories'],
   2),
  ('test-4',
   'I have lost 20 kg in 5 months, but this was more than just weight loss — it was a complete lifestyle transformation. Hritwik''s program focused on sustainable habits, from improving sleep and customizing workouts to providing real-time meal feedback and healthy choices while traveling. His holistic approach and constant support made a huge difference, helping me achieve balance physically, emotionally, and mentally.',
   'Myraa experienced a complete lifestyle transformation beyond just weight loss.',
   'Myraa',
   '1:1 Coaching',
   'Lost 20 kg in 5 months',
   ARRAY['homepage', 'stories'],
   3),
  ('test-5',
   'After years of gut issues, acidity, weight gain, and thyroid imbalance, this program completely changed my health. In one year, my gut improved, antacids stopped, thyroid levels normalized, and I lost over 10 kg — without any strict dieting. The biggest value was understanding my body. The habits I learned are now part of my lifestyle and benefit my entire family. Truly a transformative experience.',
   'Reetika resolved multiple chronic health issues through the program.',
   'Reetika Jain',
   '1:1 Coaching',
   'Lost 10+ kg, thyroid normalized',
   ARRAY['homepage', 'stories'],
   4)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 4. UPDATE STORIES with full quotes from revised copy
-- (stories already seeded in 005, just update quotes)
-- =============================================
UPDATE public.stories SET
  quote = 'He took the stress out of the entire programme so this was not just a diet plan. He focuses on being happy and content throughout the journey, which is something which we haven''t seen with other coaches before, and we''ve known coaches to be uber pushy, especially when it comes to achieving a goal — this was not the case with Hritwik.',
  author_name = 'Dhruvi and Ankit',
  badge = '1:1 Coaching',
  result = 'Lost 17 kgs in 3 months',
  before_text = 'Tried multiple coaches, felt pushed and stressed throughout',
  after_text = 'Lost 17 kgs, felt happy and content throughout the journey',
  featured = true
WHERE author_name LIKE 'Dhruvi%';

UPDATE public.stories SET
  quote = 'Working with Hritwik for four months has been transformative. I have lost 7 kg, improved my health, and adopted sustainable habits. His flexible approach focuses on fat loss, muscle gain, and practical nutrition, while incorporating mindfulness practices like pranayama and yoga. With his guidance, I''ve improved thyroid function, reduced sugar intake, and enhanced my energy, immunity, skin, hair, and sleep quality. Hritwik''s personalized support and expert advice have helped me feel healthier, more confident, and transformed into a better version of myself.',
  badge = '1:1 Coaching',
  result = 'Lost 7 kg, improved thyroid',
  before_text = 'Struggling with thyroid, low energy, sugar cravings',
  after_text = 'Lost 7 kg, improved thyroid function, better energy and sleep'
WHERE author_name = 'Disha Jain';

UPDATE public.stories SET
  quote = 'Working with Hritwik has been life-changing. Despite being a paraplegic, I lost 7 kg in six months, thanks to his tailored nutrition plan and logical guidance. I feel more energetic, less hungry, and free from unhealthy cravings. His comprehensive framework empowers sustainable changes, and his approachable nature makes the journey even better. I highly recommend Hritwik to anyone serious about achieving lasting results.',
  badge = '1:1 Coaching',
  result = 'Lost 7 kg in 6 months',
  before_text = 'Paraplegic, struggling with weight and unhealthy cravings',
  after_text = 'Lost 7 kg, more energetic, free from unhealthy cravings'
WHERE author_name = 'Adeep Jain';

UPDATE public.stories SET
  quote = 'I have lost 20 kg in 5 months, but this was more than just weight loss — it was a complete lifestyle transformation. Hritwik''s program focused on sustainable habits, from improving sleep and customizing workouts to providing real-time meal feedback and healthy choices while traveling. His holistic approach and constant support made a huge difference, helping me achieve balance physically, emotionally, and mentally. If you''re ready to feel your best, take the leap — this program truly works!',
  badge = '1:1 Coaching',
  result = 'Lost 20 kg in 5 months',
  before_text = 'Overweight, poor sleep, no sustainable habits',
  after_text = 'Lost 20 kg, complete lifestyle transformation, balanced physically and mentally',
  featured = true
WHERE author_name = 'Myraa';

UPDATE public.stories SET
  quote = 'After years of gut issues, acidity, weight gain, and thyroid imbalance, this program completely changed my health. In one year, my gut improved, antacids stopped, thyroid levels normalized, and I lost over 10 kg — without any strict dieting. The biggest value was understanding my body. The habits I learned are now part of my lifestyle and benefit my entire family. Truly a transformative experience.',
  author_role = 'Age 46, Middle East',
  badge = '1:1 Coaching',
  result = 'Lost 10+ kg, thyroid normalized',
  before_text = 'Gut issues, acidity, weight gain, thyroid imbalance for years',
  after_text = 'Gut improved, no antacids, thyroid normalized, lost 10+ kg'
WHERE author_name = 'Reetika Jain';

-- =============================================
-- 5. UPDATE BLOG POSTS with real content + publish
-- =============================================
UPDATE public.blog_posts SET
  status = 'published',
  excerpt = 'Understanding why sleep is the first pillar of the Samatvam framework — and why fixing it changes everything else.',
  body = 'Most health advice starts with what to eat or how to exercise. But at Samatvam Living, we start somewhere different: sleep.

Why? Because sleep is the foundation everything else is built on. When you''re sleep-deprived, your body enters a state of chronic stress. Cortisol stays elevated. Insulin sensitivity drops. Cravings spike. Willpower evaporates.

You can have the perfect meal plan and the ideal workout routine, but if your sleep is broken, your body will fight you every step of the way.

The Science Behind Sleep and Health

During deep sleep, your body does its most critical repair work:
- Growth hormone is released, repairing tissues and building muscle
- Your brain clears metabolic waste through the glymphatic system
- Immune function is restored and strengthened
- Emotional memories are processed and consolidated

When this process is disrupted — whether by late nights, blue light, stress, or inconsistent timing — the cascade of effects touches every system in your body.

What We See in Our Clients

Almost every client who comes to us reports some version of the same pattern: they''re doing "everything right" but nothing is working. They''re eating well, exercising, maybe even meditating. But they''re still gaining weight, still exhausted, still craving sugar at 3pm.

The common thread? Poor sleep quality.

Not necessarily poor sleep quantity — many of them are in bed for 7-8 hours. But the quality of that sleep is compromised. They''re waking up multiple times. They''re not reaching deep sleep stages. Their nervous system never fully downregulates.

The Samatvam Approach to Sleep

We don''t just tell you to "sleep more." We work on the systems that govern sleep quality:

1. Circadian rhythm alignment — Getting morning light, consistent timing, and proper evening wind-down
2. Nervous system regulation — Teaching your body it''s safe enough to fully rest
3. Environmental optimization — Temperature, light, sound, and pre-sleep routines
4. Stress response management — Addressing the cortisol patterns that fragment sleep

When sleep improves, everything else follows. Energy stabilizes. Cravings reduce. Exercise becomes enjoyable instead of punishing. Weight starts to shift without forcing it.

This is why Restore comes first in our framework. Not because it''s easy, but because it makes everything else possible.',
  category = 'Sleep Science',
  image_url = 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&q=80'
WHERE id = 'blog-1';

UPDATE public.blog_posts SET
  status = 'published',
  excerpt = 'Your nervous system isn''t broken — it''s stuck in protection mode. Here''s what that means and how to shift it.',
  body = 'You''ve probably heard the phrase "nervous system regulation" thrown around in wellness spaces. But what does it actually mean? And why does it matter for your health goals?

Let''s break it down simply.

Your Nervous System Has Two Modes

Your autonomic nervous system operates in two primary states:

Sympathetic (fight or flight) — This is your body''s emergency response. Heart rate increases, digestion slows, muscles tense, cortisol floods your system. It''s designed for short-term threats.

Parasympathetic (rest and digest) — This is your body''s recovery state. Heart rate slows, digestion activates, repair processes begin, hormones rebalance. This is where healing happens.

The problem? Modern life keeps most people stuck in sympathetic mode. Not because of actual danger, but because of:
- Constant notifications and digital stimulation
- Work pressure and deadlines
- Poor sleep and irregular schedules
- Processed food and blood sugar spikes
- Lack of genuine rest and recovery

When Emergency Mode Becomes the Default

When your nervous system is chronically activated, your body behaves as if it''s under constant threat. This creates a cascade of symptoms that most people try to solve with the wrong tools:

- Weight gain (especially around the midsection) — cortisol promotes fat storage
- Sugar cravings — your brain demands quick energy for the "emergency"
- Poor sleep — your body won''t fully rest if it doesn''t feel safe
- Digestive issues — digestion is deprioritized during stress
- Brain fog — cognitive resources are redirected to survival

Sound familiar? These aren''t character flaws. They''re your body doing exactly what it''s designed to do under perceived threat.

What a Nervous System Reset Actually Looks Like

It''s not about one meditation session or a weekend retreat. A genuine nervous system reset involves consistently signaling safety to your body through:

Daily practices: Breathwork (especially extended exhale patterns), gentle movement, time in nature, and consistent sleep timing.

Environmental changes: Reducing stimulation, creating buffer zones between work and rest, and building predictable routines your body can rely on.

Nutritional support: Stable blood sugar, adequate protein, and reducing inflammatory triggers that keep your body on alert.

Relational safety: Having support, feeling heard, and not trying to white-knuckle your way through change alone.

This is exactly what the Restore phase of our framework addresses. Before we talk about nutrition plans or workout routines, we help your body remember what safety feels like. Because when your nervous system downregulates, everything else becomes dramatically easier.',
  category = 'Nervous System',
  image_url = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80'
WHERE id = 'blog-2';

UPDATE public.blog_posts SET
  status = 'published',
  excerpt = 'The 3pm energy crash isn''t about willpower. It''s about blood sugar. Here''s how to fix it.',
  body = 'If you''ve ever experienced that mid-afternoon crash — the one where you suddenly can''t focus, you''re reaching for coffee or chocolate, and your brain feels like it''s wading through fog — you''re not alone. And it''s not a willpower problem.

It''s a blood sugar problem.

What''s Actually Happening

When you eat foods that spike your blood sugar rapidly (refined carbs, sugary snacks, even some "healthy" smoothies), your body responds with a surge of insulin to bring glucose levels back down. But this response often overshoots, causing your blood sugar to crash below baseline.

This crash triggers:
- Intense cravings for more sugar or carbs
- Brain fog and difficulty concentrating
- Irritability and mood swings
- Fatigue that no amount of coffee fixes
- Increased cortisol (stress hormone) as your body tries to stabilize

The cycle repeats: spike, crash, crave, repeat. Day after day.

Why This Matters Beyond Energy

Chronic blood sugar instability doesn''t just affect your afternoon. Over time, it contributes to:
- Weight gain, especially visceral fat
- Insulin resistance (a precursor to type 2 diabetes)
- Hormonal imbalances
- Poor sleep quality
- Increased inflammation
- Accelerated aging

The Samatvam Approach to Blood Sugar

In our Nourish phase, we don''t give you a restrictive diet. Instead, we teach you how to eat in a way that keeps your blood sugar stable throughout the day:

1. Protein-first breakfast — Eating 20-30g of protein within an hour of waking sets the tone for the entire day. This single habit can reduce cravings by up to 60%.

2. The right order — When you do eat carbs, pairing them with protein and fat, or eating them after fiber and protein, dramatically reduces the glucose spike.

3. Movement after meals — Even a 10-minute walk after eating can reduce blood sugar spikes by 30-50%.

4. Consistent meal timing — Your body thrives on predictability. Eating at roughly the same times each day helps your insulin response become more efficient.

5. Real food focus — We don''t eliminate food groups. We focus on whole, minimally processed foods that your body knows how to handle.

The Result

When blood sugar stabilizes, the changes are remarkable:
- Steady energy from morning to evening
- Cravings dramatically reduce or disappear
- Better sleep (no more cortisol spikes at 3am)
- Clearer thinking and improved focus
- Natural, sustainable weight management

This isn''t about restriction. It''s about understanding how your body processes fuel and working with that biology instead of against it.

The best part? Most clients notice a significant difference within the first two weeks. Not because they''re on a strict diet, but because they''re finally giving their body what it actually needs.',
  category = 'Nutrition',
  image_url = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80'
WHERE id = 'blog-3';

-- Add 2 more blog posts
INSERT INTO public.blog_posts (id, title, category, status, excerpt, body, image_url) VALUES
  ('blog-4',
   'Why Willpower Fails (And What to Use Instead)',
   'Habits & Mindset',
   'published',
   'Discipline isn''t the missing ingredient. Safety is. Here''s why your body resists change and how to work with it.',
   'Every January, millions of people make the same resolution: eat better, exercise more, sleep earlier. By February, most have given up. The common explanation? "I just don''t have enough willpower."

But here''s what the science actually shows: willpower is a limited resource, and it''s the wrong tool for lasting change.

The Willpower Myth

Willpower operates from your prefrontal cortex — the rational, planning part of your brain. It''s powerful but expensive. It requires glucose, rest, and low stress to function well.

The problem is that most people try to use willpower precisely when it''s least available:
- When they''re tired (depleted glucose)
- When they''re stressed (prefrontal cortex goes offline)
- When they''re hungry (survival brain takes over)
- When they''re emotionally triggered (amygdala hijack)

In other words, you''re trying to use your weakest tool at your most vulnerable moments.

What Actually Drives Behavior Change

Lasting change doesn''t come from forcing yourself to do hard things. It comes from making the right things easier:

Environment design — Remove friction from good habits, add friction to bad ones. If you want to eat better, don''t keep junk food in the house. If you want to sleep earlier, put your phone in another room at 9pm.

Identity shifts — Instead of "I''m trying to eat healthy," shift to "I''m someone who nourishes their body." Small but powerful reframe.

Nervous system state — This is the one nobody talks about. When your nervous system is in fight-or-flight, your brain defaults to familiar, comforting behaviors (hello, sugar cravings). When you feel safe and regulated, making good choices feels natural.

Habit stacking — Attach new behaviors to existing routines. "After I pour my morning coffee, I take 5 deep breaths." The existing habit becomes the trigger.

The Samatvam Difference

This is exactly why our framework starts with Restore, not with nutrition or exercise. When your body feels safe — when sleep is solid, stress is managed, and your nervous system is regulated — behavior change stops feeling like a battle.

Our clients consistently report the same thing: "I don''t know why, but I just don''t crave sugar anymore." It''s not magic. It''s biology. When cortisol normalizes and blood sugar stabilizes, the cravings that felt impossible to resist simply fade.

You don''t need more discipline. You need a body that''s not in emergency mode.',
   'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=80'),
  ('blog-5',
   'The Morning Routine That Actually Works',
   'Practical Tips',
   'published',
   'Forget the 5am cold plunge. Here''s a morning routine backed by science that takes 20 minutes and actually sticks.',
   'The internet is full of elaborate morning routines: wake at 4:30am, cold plunge, journal for 30 minutes, meditate, exercise, make a green smoothie — all before 7am.

For most people with real lives, jobs, and families, this is fantasy. And trying to implement it leads to guilt when you inevitably can''t sustain it.

Here''s what actually works, based on circadian biology and what we''ve seen with hundreds of clients.

The 20-Minute Morning That Changes Everything

1. Light first (2 minutes) — Within 30 minutes of waking, get natural light in your eyes. Step outside, stand by a window, or sit on your balcony. This resets your circadian clock and triggers a healthy cortisol awakening response.

Why it matters: Morning light exposure has been shown to improve sleep quality that same night, boost mood, and increase daytime alertness.

2. Hydrate (1 minute) — Drink a full glass of water. You''ve been fasting for 7-8 hours. Your body is dehydrated. Coffee can wait 90 minutes (this allows your natural cortisol peak to do its job first).

3. Move gently (5-10 minutes) — This isn''t a workout. It''s gentle movement to wake up your body: stretching, a short walk, some yoga poses. The goal is to shift from parasympathetic (sleep) to a gentle sympathetic state without spiking cortisol.

4. Protein-first breakfast (10 minutes) — Eat 20-30g of protein within an hour of waking. This stabilizes blood sugar for the entire day, reduces afternoon cravings, and supports muscle maintenance.

Simple options: eggs and toast, Greek yogurt with nuts, a protein smoothie, or overnight oats with protein powder.

That''s it. No cold plunge. No 45-minute meditation. No guilt.

Why This Works

Each element targets a specific biological system:
- Light → circadian rhythm
- Water → hydration and metabolism
- Movement → nervous system transition
- Protein → blood sugar stability

Together, they create a cascade of positive effects that compound throughout the day. Better energy, fewer cravings, improved focus, and better sleep that night.

The Key: Consistency Over Perfection

You don''t need to do this perfectly every day. Aim for 5 out of 7 days. That''s enough for your body to establish the pattern and start benefiting from it.

The best morning routine is the one you actually do. Start here, and build from this foundation.',
   'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 6. UPDATE SETTINGS
-- =============================================
UPDATE public.settings SET
  contact_email = 'deepti@samatvam.living',
  features = '{"blog": true, "selfRegistration": false, "inAppMessaging": true}'::jsonb
WHERE id = 'settings';
