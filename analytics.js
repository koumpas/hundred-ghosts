// Hundred Ghosts - usage events for PostHog. No SDK, no cookies, no session recording, no autocapture.
// Each browser gets a random id (kept in localStorage) so that unique players can be counted. Nicknames are never sent.
// Events follow the owner's convention for games: game_loaded, game_started, heartbeat, all with game = 'hundred-ghosts'.
// The key below is a PostHog project token: write-only and made to be public.
(function () {
'use strict';
const KEY = 'phc_m3GQubXSTM9YFTibQHLAYrQLoqvV8dqSe6duPKugNyBC', HOST = 'https://us.i.posthog.com', GAME = 'hundred-ghosts';
const q = new URLSearchParams(location.search);
// off on a local server, for bot runs (auto=...), in headless tools, and when the browser asks not to be tracked
const off = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || q.get('auto') || ['headless', 'sheet'].includes(q.get('mode')) || navigator.webdriver || navigator.doNotTrack === '1' || navigator.globalPrivacyControl;
let id = ''; try { id = localStorage.getItem('hg_aid') || ''; if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : 'hg-' + Math.random().toString(36).slice(2) + Date.now().toString(36)); localStorage.setItem('hg_aid', id); } } catch (e) { id = 'hg-' + Math.random().toString(36).slice(2); }
let ref = ''; try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
function track(event, props) {
  if (off) return;
  const body = JSON.stringify({ api_key: KEY, event, distinct_id: id, timestamp: new Date().toISOString(), properties: Object.assign({
    game: GAME, $process_person_profile: false, $lib: 'hg-lite', $current_url: location.origin + location.pathname, $host: location.host, $pathname: location.pathname,   // no query string: it can hold a private key
    $referring_domain: ref || '$direct', $screen_width: screen.width, $screen_height: screen.height, touch: 'ontouchstart' in window, game_version: window.HG_SIM ? HG_SIM.VERSION : null }, props || {}) });
  try { if (!(navigator.sendBeacon && navigator.sendBeacon(HOST + '/i/v0/e/', new Blob([body], { type: 'text/plain' })))) fetch(HOST + '/i/v0/e/', { method: 'POST', body, keepalive: true, headers: { 'content-type': 'text/plain' } }).catch(() => {}); } catch (e) {}
}
let playing = false;
window.HGTrack = function (event, props) { if (event === 'game_started') playing = true; track(event, props); };
track('$pageview'); track('game_loaded');
// one heartbeat a minute while the tab is visible and the visitor has started to play: heartbeats = minutes played
setInterval(() => { if (playing && document.visibilityState === 'visible') track('heartbeat'); }, 60000);
})();
