// Coming Soon Gate
// Add ?access=samatvam2025 to any URL to bypass, or visit /coming-soon.html to see the page
// To disable: remove this script from all HTML files or set COMING_SOON = false
(function() {
  var COMING_SOON = true;
  var ACCESS_KEY = 'samatvam2025';
  var STORAGE_KEY = 'stvm_access';

  if (!COMING_SOON) return;

  // Don't gate the coming-soon page itself, admin, or client pages
  var path = window.location.pathname;
  if (path.includes('coming-soon') || path.includes('/admin') || path.includes('/client')) return;

  // Check if access granted via URL param
  var params = new URLSearchParams(window.location.search);
  if (params.get('access') === ACCESS_KEY) {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    // Remove the param from URL for clean look
    params.delete('access');
    var clean = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState({}, '', clean);
    return;
  }

  // Check if already unlocked this session
  if (sessionStorage.getItem(STORAGE_KEY) === 'true') return;

  // Redirect to coming soon
  window.location.replace('/coming-soon.html');
})();
