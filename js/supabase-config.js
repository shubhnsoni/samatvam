/* ============================================
   SAMATVAM LIVING — Supabase Configuration
   Initializes the Supabase client for use across
   all pages (public, admin, client).
   ============================================ */

const SUPABASE_URL = 'https://mwiuckvmvyokiwmhpyfv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13aXVja3Ztdnlva2l3bWhweWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODQyMzAsImV4cCI6MjA4NjA2MDIzMH0.4wJAmCWWGmvlhdCy10sy7C5UTZZHXsPRbsmLsqu1CrI';

// Initialize Supabase client (requires supabase-js CDN loaded before this file)
// Named supabaseClient to avoid collision with the CDN's window.supabase namespace
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
