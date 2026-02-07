-- ============================================
-- SAMATVAM LIVING — Footer Customization
-- Adds footer social links and menu JSONB to settings.
-- ============================================

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS footer_socials JSONB DEFAULT '[
  {"platform": "instagram", "url": "", "enabled": true},
  {"platform": "twitter", "url": "", "enabled": true},
  {"platform": "linkedin", "url": "", "enabled": true},
  {"platform": "email", "url": "", "enabled": true},
  {"platform": "youtube", "url": "", "enabled": false},
  {"platform": "facebook", "url": "", "enabled": false}
]'::jsonb;

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS footer_menu JSONB DEFAULT '[
  {"label": "Method", "url": "how-it-works.html", "enabled": true},
  {"label": "About", "url": "about.html", "enabled": true},
  {"label": "Stories", "url": "stories.html", "enabled": true},
  {"label": "Programs", "url": "programs.html", "enabled": true},
  {"label": "Insights", "url": "blog.html", "enabled": true},
  {"label": "Contact", "url": "contact.html", "enabled": true}
]'::jsonb;

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS footer_legal JSONB DEFAULT '[
  {"label": "Privacy Policy", "url": "#", "enabled": true},
  {"label": "Terms of Service", "url": "#", "enabled": true},
  {"label": "Disclaimer", "url": "#", "enabled": true}
]'::jsonb;

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS footer_copyright TEXT DEFAULT '© 2026 Samatvam Living. All rights reserved.';
