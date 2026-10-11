(function () {
  'use strict';

  var settings = document.currentScript;
  var projectKey = settings && settings.dataset.projectKey;
  var apiHost = settings && settings.dataset.apiHost;
  var localPreview = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);

  // Leave local previews and unconfigured installations out of production metrics.
  if (!projectKey || !apiHost || localPreview || window.location.protocol === 'file:') return;

  // PostHog's asynchronous loader queues events while the SDK downloads.
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split('.');2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement('script')).type='text/javascript',p.crossOrigin='anonymous',p.async=!0,p.src=s.api_host.replace('.i.posthog.com','-assets.i.posthog.com')+'/static/array.js',(r=t.getElementsByTagName('script')[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a='posthog',u.people=u.people||[],Object.defineProperty(u,'toString',{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e='posthog';return'posthog'!==a&&(e+='.'+a),t||(e+=' (stub)'),e}}),Object.defineProperty(u.people,'toString',{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+'.people (stub)'}}),o='init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug'.split(' '),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  window.posthog.init(projectKey, {
    api_host: apiHost,
    defaults: '2026-08-30',
    capture_pageview: true,
    capture_pageleave: true,
    save_referrer: true,
    save_campaign_params: true,
    person_profiles: 'identified_only',
    autocapture: false,
    disable_session_recording: true,
    disable_surveys: true,
    loaded: function (posthog) {
      posthog.register({ site: 'cabinex_landing' });
    }
  });

  // These are link clicks, not completed bookings or sent emails.
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a');
    if (!link) return;
    if (link.matches('.cta')) {
      window.posthog.capture('demo_cta_clicked', {
        placement: 'hero',
        destination: link.href
      }, { transport: 'sendBeacon' });
    } else if ((link.getAttribute('href') || '').indexOf('mailto:') === 0) {
      window.posthog.capture('contact_email_clicked', { placement: 'footer' }, { transport: 'sendBeacon' });
    }
  });

  // Measure exposure to the thumbnail; playback tracking can follow the YouTube integration.
  var preview = document.querySelector('.video-preview');
  if (preview && window.IntersectionObserver) {
    var observer = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting && entry.intersectionRatio >= 0.5; })) {
        window.posthog.capture('video_thumbnail_viewed');
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(preview);
  }

  var milestones = [25, 50, 75, 100];
  var reached = {};
  var pending = false;
  function measureScroll() {
    pending = false;
    var root = document.documentElement;
    var pageHeight = Math.max(root.scrollHeight, document.body.scrollHeight);
    var progress = Math.min(100, (window.scrollY + window.innerHeight) / pageHeight * 100);
    milestones.forEach(function (percent) {
      if (!reached[percent] && progress >= percent) {
        reached[percent] = true;
        window.posthog.capture('scroll_depth_reached', { percent: percent });
      }
    });
  }
  function scheduleScroll() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(measureScroll);
  }
  window.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', scheduleScroll);
  window.addEventListener('load', scheduleScroll);
  scheduleScroll();
})();
