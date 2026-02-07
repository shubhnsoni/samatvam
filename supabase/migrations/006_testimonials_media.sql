-- ============================================
-- SAMATVAM LIVING — Add media fields to testimonials
-- Run this AFTER 005_stories_table.sql
-- ============================================

ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS img_before TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS img_after TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS before_text TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS after_text TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS result TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
