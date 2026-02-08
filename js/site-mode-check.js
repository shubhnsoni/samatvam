/* ============================================
   SAMATVAM LIVING — Site Mode Check
   Lightweight script that checks if Coming Soon
   mode is enabled and redirects public pages.
   Must load AFTER supabase-config.js
   ============================================ */
(function() {
  // Skip if on coming-soon page already
  if (window.location.pathname.includes('coming-soon')) return;
  // Skip if on admin pages
  if (window.location.pathname.includes('/admin')) return;
  // Skip if on client portal pages
  if (window.location.pathname.includes('/client')) return;

  // Check Supabase for site mode
  if (typeof supabaseClient === 'undefined') return;

  supabaseClient
    .from('settings')
    .select('features')
    .eq('id', 'settings')
    .single()
    .then(function(result) {
      if (result.error) return;
      var features = result.data && result.data.features;
      if (features && features.comingSoon) {
        // Build path to coming-soon.html relative to current page
        var path = window.location.pathname;
        var base = path.substring(0, path.lastIndexOf('/') + 1);
        window.location.replace(base + 'coming-soon.html');
      }
    })
    .catch(function() {
      // Silently fail — don't block the site if check fails
    });
})();
