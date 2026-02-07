# Samatvam Living — Full Wellness Website

Build an end-to-end wellness website with a scroll-story homepage, public pages, and client portal wireframes using plain HTML, CSS, JavaScript, and GSAP for animations.

---

## Tech Stack

- **HTML5** — Semantic, multi-page static site
- **CSS3** — Custom properties, Grid, Flexbox (no frameworks)
- **JavaScript** — Vanilla ES6+
- **GSAP + ScrollTrigger** — Scroll-based narrative animations (CDN)
- **Google Fonts** — Playfair Display (serif) + Inter (sans)
- **Color Palette**: Cream `#FAF8F5`, Muted Green `#4A5D4E`, Warm Charcoal `#2D2D2D`, Soft Sage `#B8C5A3`, Accent `#8B6F47`

---

## Phase 1: Foundation + Homepage (This Session)

### Step 1 — Project Setup
- Create folder structure
- `css/style.css` — global styles, variables, typography, layout
- `css/home.css` — homepage-specific styles
- `js/main.js` — shared nav/footer logic
- `js/home.js` — GSAP scroll animations for homepage
- Shared `navbar` + `footer` as HTML partials (injected via JS include or repeated)

### Step 2 — Homepage (`index.html`) — Award-Level Scroll Story
8 sections with GSAP ScrollTrigger:

1. **Hero** — "Eat clean. Move more. Sleep better." scroll-revealed line by line → "You already know this."
2. **Inner Dialogue** — Thought bubbles appearing chaotically on scroll → "What am I missing?"
3. **The Reframe** — Full-width darker section: "Not discipline. Nervous system." (emotional hinge)
4. **Modern Life** — Editorial sentence + fade-in symptom tags
5. **Framework** — Restore / Nourish / Move as sequential scroll chapters
6. **Offerings** — 4 program cards with hover dim (matches reference image 2)
7. **Testimonials** — One per scroll, big text, minimal UI
8. **Final CTA** — "Your body isn't broken. It's just overwhelmed." + Book Discovery Call

### Step 3 — Shared Navbar & Footer
- Navbar: Samatvam Living | Method · Stories · Programs · Contact · Login
- Footer: links, philosophy tagline, copyright
- Consistent across all pages

---

## Phase 2: Public Pages (Wireframes with real layout + placeholder content)

### Step 4 — How It Works (`how-it-works.html`)
- Nervous system explanation, Restore → Nourish → Move, why order matters

### Step 5 — About (`about.html`)
- Two-column founder cards (matches reference image 3), philosophy section

### Step 6 — Programs Overview (`programs.html`)
- 4 cards with status badges, duration, "Ideally for" (matches reference image 2)
- "Not sure? Book a Clarity Call" CTA

### Step 7 — Program Detail Pages
- `program-coaching.html`, `program-cohort.html`, `program-corporate.html`, `program-masterclass.html`
- Each: overview, who it's for, structure, CTA

### Step 8 — Stories (`stories.html`)
- Full-page scroll testimonials

### Step 9 — Contact (`contact.html`)
- Booking explanation, what happens next, reassurance

---

## Phase 3: Client Portal (Wireframe pages, structure only)

### Step 10 — Client Pages
- `client/login.html` — Magic link login
- `client/index.html` — Dashboard (greeting, phase, weekly focus)
- `client/focus.html` — One habit at a time
- `client/plan.html` — Restore / Nourish / Move sections
- `client/resources.html` — Videos, PDFs, filtered
- `client/progress.html` — Reflections, no metrics
- `client/support.html` — WhatsApp + async

---

## Phase 4: Admin / CMS (Internal System)

One unified internal panel — not two separate products.

### Step 11 — Admin Login (`admin/login.html`)
- Simple admin login form (email + password)
- Client-side auth simulation (localStorage token for demo)
- Redirects to dashboard on success

### Step 12 — Admin Dashboard (`admin/index.html`)
- Overview cards: total clients, active programs, pending reviews
- Quick links to all admin sections
- Role indicator (Admin / Coach / Content Editor)

### Step 13 — Client Management (`admin/clients.html`)
- Client list table (name, program, phase, status)
- Click to view/edit individual client
- `admin/client-detail.html` — Assign program, set phase (Restore/Nourish/Move), add coach notes

### Step 14 — CMS Content Management
- **Programs** (`admin/cms-programs.html`) — Edit program cards, descriptions, status badges, pricing flags
- **Testimonials** (`admin/cms-testimonials.html`) — Add/edit/remove testimonials shown on public site
- **Founders** (`admin/cms-founders.html`) — Edit bios, quotes, photos
- **Resources** (`admin/cms-resources.html`) — Upload/manage videos, PDFs, worksheets (with phase/program tags)
- **Weekly Focus** (`admin/cms-focus.html`) — Create/edit weekly focus templates assigned to clients
- **Blog/Insights** (`admin/cms-blog.html`) — Optional, for Phase 2 journal

### Step 15 — Admin Settings (`admin/settings.html`)
- Role management (Admin, Coach, Content Editor)
- Program availability toggles
- General site settings

### CMS Architecture Note
Since this is a static HTML/CSS/JS project, the CMS will be:
- **UI-complete** — All forms, tables, and editing interfaces are fully built
- **localStorage-powered** — Data stored in browser for demo/prototype purposes
- **Backend-ready** — Structured so that swapping localStorage for a real API (Firebase, Supabase, custom backend) requires minimal changes
- Content edited in admin → saved to localStorage → read by public pages via JS

---

## Deliverables This Session

1. **Full working homepage** with all 8 scroll-story sections + GSAP animations
2. **Basic wireframes** for all public pages (real layout, placeholder content)
3. **Client portal page stubs** (structure + layout)
4. **Admin/CMS panel** — login, dashboard, client management, content editing (localStorage-powered)
5. **Runs by opening `index.html`** in browser — no build step needed

---

## File Structure

```
smtvam/
├── index.html                  (homepage)
├── how-it-works.html
├── about.html
├── programs.html
├── program-coaching.html
├── program-cohort.html
├── program-corporate.html
├── program-masterclass.html
├── stories.html
├── contact.html
├── client/
│   ├── login.html
│   ├── index.html
│   ├── focus.html
│   ├── plan.html
│   ├── resources.html
│   ├── progress.html
│   └── support.html
├── admin/
│   ├── login.html              (admin login)
│   ├── index.html              (admin dashboard)
│   ├── clients.html            (client list)
│   ├── client-detail.html      (individual client view/edit)
│   ├── cms-programs.html       (edit programs)
│   ├── cms-testimonials.html   (edit testimonials)
│   ├── cms-founders.html       (edit founder bios)
│   ├── cms-resources.html      (manage resources)
│   ├── cms-focus.html          (weekly focus templates)
│   ├── cms-blog.html           (blog/insights — optional)
│   └── settings.html           (roles, toggles)
├── css/
│   ├── style.css               (global: variables, reset, typography, nav, footer)
│   ├── home.css                (homepage sections)
│   ├── pages.css               (shared styles for inner pages)
│   └── admin.css               (admin panel styles)
├── js/
│   ├── main.js                 (nav toggle, shared utilities)
│   ├── home.js                 (GSAP ScrollTrigger animations)
│   ├── admin.js                (admin panel logic, CRUD, auth)
│   └── cms-data.js             (localStorage data layer — shared by public + admin)
└── assets/
    └── images/                 (placeholder images)
```
