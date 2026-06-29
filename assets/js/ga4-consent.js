(function () {
  var GA_ID = 'G-HP8MCG44T1';
  var CONSENT_KEY = 'ajspinning_cookie_consent';

  function hasAcceptedCookies() {
    try {
      var v = localStorage.getItem(CONSENT_KEY);
      if (v === 'accepted') return true;

      var all = '';
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        all += ' ' + k + '=' + localStorage.getItem(k);
      }

      all += ' ' + document.cookie;
      all = all.toLowerCase();

      return (
        all.includes('accepted') ||
        all.includes('accept') ||
        all.includes('acept') ||
        all.includes('granted') ||
        all.includes('all')
      );
    } catch (e) {
      return false;
    }
  }

  function hasRejectedCookies() {
    try {
      var v = localStorage.getItem(CONSENT_KEY);
      if (v === 'rejected') return true;

      var all = '';
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        all += ' ' + k + '=' + localStorage.getItem(k);
      }

      all += ' ' + document.cookie;
      all = all.toLowerCase();

      return (
        all.includes('rejected') ||
        all.includes('reject') ||
        all.includes('rechaz')
      );
    } catch (e) {
      return false;
    }
  }

  function loadGA4() {
    if (window.__aj_ga4_loaded) return;
    window.__aj_ga4_loaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ dataLayer.push(arguments); };

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);

    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }

  window.ajLoadGA4 = loadGA4;

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('button, a');
    if (!btn) return;

    var txt = (btn.textContent || '').trim().toLowerCase();

    if (
      txt.includes('aceptar') ||
      txt.includes('acceptar') ||
      txt.includes('acepta todas') ||
      txt.includes('aceptar todas')
    ) {
      try { localStorage.setItem(CONSENT_KEY, 'accepted'); } catch (e) {}
      loadGA4();
    }

    if (
      txt.includes('rechazar') ||
      txt.includes('rebutjar') ||
      txt.includes('reject')
    ) {
      try { localStorage.setItem(CONSENT_KEY, 'rejected'); } catch (e) {}
    }
  });

  if (hasAcceptedCookies() && !hasRejectedCookies()) {
    loadGA4();
  }
})();
