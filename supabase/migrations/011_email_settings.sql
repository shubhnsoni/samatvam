-- ============================================
-- SAMATVAM LIVING — Email Settings (EmailJS)
-- Adds EmailJS configuration columns to settings.
-- ============================================

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS emailjs_public_key TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS emailjs_service_id TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS emailjs_contact_template TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS emailjs_payment_template TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS emailjs_admin_template TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS admin_email TEXT DEFAULT '';

-- Add email feature toggle (default OFF)
UPDATE public.settings
SET features = features || '{"emailNotifications": false}'::jsonb
WHERE id = 'settings' AND NOT (features ? 'emailNotifications');
