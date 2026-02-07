-- ============================================
-- SAMATVAM LIVING — Payments & Checkout
-- Adds payments table, program price columns,
-- and payment settings fields.
-- Run AFTER all previous migrations.
-- ============================================

-- =============================================
-- 1. ADD PRICE COLUMNS TO PROGRAMS
-- =============================================
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS price_usd INT DEFAULT 0;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS price_inr INT DEFAULT 0;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS stripe_price_id TEXT DEFAULT '';
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS razorpay_plan_id TEXT DEFAULT '';

-- Seed prices for existing programs (in cents / paise)
UPDATE public.programs SET price_usd = 90000, price_inr = 7500000 WHERE id = 'prog-1';  -- $900 / ₹75,000
UPDATE public.programs SET price_usd = 40000, price_inr = 3500000 WHERE id = 'prog-2';  -- $400 / ₹35,000
UPDATE public.programs SET price_usd = 0,     price_inr = 0       WHERE id = 'prog-3';  -- Custom pricing
UPDATE public.programs SET price_usd = 0,     price_inr = 0       WHERE id = 'prog-4';  -- Coming soon

-- =============================================
-- 2. ADD PAYMENT SETTINGS TO SETTINGS TABLE
-- =============================================
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS razorpay_key_id TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS razorpay_key_secret TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe';

-- Add checkout to features JSONB (default OFF)
UPDATE public.settings
SET features = features || '{"checkout": false}'::jsonb
WHERE id = 'settings' AND NOT (features ? 'checkout');

-- =============================================
-- 3. PAYMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_email TEXT NOT NULL,
  client_name TEXT DEFAULT '',
  program_id TEXT REFERENCES public.programs(id) ON DELETE SET NULL,
  program_title TEXT DEFAULT '',
  amount INT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_payment_id TEXT DEFAULT '',
  provider_session_id TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Public can insert (checkout creates payment record)
CREATE POLICY "Anyone can create a payment record" ON public.payments
  FOR INSERT WITH CHECK (true);

-- Public can update their own pending payment (for webhook/callback status update)
CREATE POLICY "Anyone can update pending payments" ON public.payments
  FOR UPDATE USING (status = 'pending');

-- Admins can view all payments
CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can manage all payments
CREATE POLICY "Admins can manage payments" ON public.payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Updated_at trigger
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
