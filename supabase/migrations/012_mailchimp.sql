-- ============================================
-- SAMATVAM LIVING — Mailchimp Integration
-- Adds Mailchimp configuration to settings.
-- ============================================

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS mailchimp_form_action TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS mailchimp_u TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS mailchimp_id TEXT DEFAULT '';

-- Add mailchimp feature toggle (default OFF)
UPDATE public.settings
SET features = features || '{"mailchimp": false}'::jsonb
WHERE id = 'settings' AND NOT (features ? 'mailchimp');
