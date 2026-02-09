-- ============================================
-- SAMATVAM LIVING — Missing Page Content Rows
-- Adds entries that exist as data-cms in HTML
-- but were missing from the seed data.
-- Run in Supabase SQL Editor.
-- ============================================

-- Fix ID mismatch: HTML uses hp-framework-title, seed had hp-framework-heading
INSERT INTO public.page_content (id, page, section, field, value, sort_order) VALUES
  ('hp-framework-title', 'homepage', 'framework', 'title', 'We start with your biology — not food rules.', 1)
ON CONFLICT (id) DO NOTHING;

-- WhatsApp Community section (missing from original seed)
INSERT INTO public.page_content (id, page, section, field, value, sort_order) VALUES
  ('hp-wa-title', 'homepage', 'whatsapp', 'title', 'Join Our Free <em>Wellness Community</em>', 0),
  ('hp-wa-desc', 'homepage', 'whatsapp', 'description', 'Get daily health tips, ask questions, and connect with like-minded people on their wellness journey. No spam, just value.', 1),
  ('hp-wa-link', 'homepage', 'whatsapp', 'link', 'https://chat.whatsapp.com/FN0CyVJSDCxDWwJ8gKian3', 2)
ON CONFLICT (id) DO NOTHING;

-- Hero headlines (missing data-cms tags were just added)
-- These already exist in seed 003 as hp-hero-line1/2/3, no action needed.

-- Final CTA email text
INSERT INTO public.page_content (id, page, section, field, value, sort_order) VALUES
  ('hp-cta-email', 'homepage', 'cta', 'email_text', 'Questions? Email us at contact@samatvam.living', 3)
ON CONFLICT (id) DO NOTHING;
