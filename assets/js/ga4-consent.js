(function () {
  var GA_ID = 'G-HP8MCG44T1';
  var CONSENT_KEY = 'ajspinning_cookie_consent_v1';

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ dataLayer.push(arguments); };

  // Consent Mode: carregar l'etiqueta, però sense cookies fins acceptació.
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });

  function loadGtagBase() {
    if (window.__aj_ga4_base_loaded) return;
    window.__aj_ga4_base_loaded = true;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);

    gtag('js', new Date());
    gtag('config', GA_ID, {
      anonymize_ip: true
    });
  }

  function setConsentAccepted() {
    try { localStorage.setItem(CONSENT_KEY, 'accepted'); } catch (e) {}
    gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
  }

  function setConsentRejected() {
    try { localStorage.setItem(CONSENT_KEY, 'rejected'); } catch (e) {}
    gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }

  function getConsentValue() {
    try {
      return localStorage.getItem(CONSENT_KEY);
    } catch (e) {
      return null;
    }
  }

  // Carregar sempre la base perquè Google detecti la etiqueta.
  loadGtagBase();

  // Si ja havia acceptat abans, actualitzar consentiment.
  if (getConsentValue() === 'accepted') {
    setConsentAccepted();
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('button, a');
    if (!btn) return;

    var txt = (btn.textContent || '').trim().toLowerCase();

    if (
      txt.includes('aceptar') ||
      txt.includes('aceptar todas') ||
      txt.includes('acepta todas')
    ) {
      setConsentAccepted();
    }

    if (
      txt.includes('rechazar') ||
      txt.includes('rechazar todas')
    ) {
      setConsentRejected();
    }
  });
})();
