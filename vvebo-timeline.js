// VVebo timeline adapter for Shadowrocket.
// Request phase: capture target UID and rewrite legacy timeline requests.
// Response phase: convert profile card data to legacy statuses data.
const UID_KEY = 'vvebo_target_uid';
const url = $request.url;
const isRequest = typeof $response === 'undefined';
function uidFromUrl(s) {
  const m = s.match(/[?&]uid=(\d+)(?:&|$)/);
  return m ? m[1] : null;
}
function finish(x) { $done(x || {}); }
if (isRequest) {
  if (/\/2\/users\/show\?/.test(url) || /\/2\/remind\/unread_count\?/.test(url)) {
    const uid = uidFromUrl(url);
    if (uid) $persistentStore.write(uid, UID_KEY);
    finish({});
  } else if (/\/2\/statuses\/user_timeline\?/.test(url)) {
    const uid = uidFromUrl(url) || $persistentStore.read(UID_KEY);
    if (!uid) {
      console.log('[VVebo] Cannot rewrite timeline: no target UID');
      finish({});
    } else {
      let next = url.replace('/2/statuses/user_timeline?', '/2/profile/statuses/tab?');
      next = next.replace(/([?&])max_id=/, '$1since_id=');
      if (!uidFromUrl(next)) next += '&uid=' + encodeURIComponent(uid);
      if (!/[?&]containerid=/.test(next)) next += '&containerid=' + encodeURIComponent('230413' + uid + '_-_WEIBO_SECOND_PROFILE_WEIBO');
      console.log('[VVebo] Rewrote timeline for uid=' + uid);
      finish({url: next});
    }
  } else finish({});
} else if (/\/2\/profile\/statuses\/tab\?/.test(url)) {
  try {
    const data = JSON.parse($response.body);
    if (!Array.isArray(data.cards)) {
      console.log('[VVebo] Missing cards in profile response');
      finish({});
    } else {
      const cards = data.cards.flatMap(card => Array.isArray(card.card_group) ? card.card_group : [card]);
      const statuses = cards.filter(card => card && card.card_type === 9 && card.mblog).map(card => card.mblog).map(status => status.isTop ? {...status, label: '置顶'} : status);
      const sinceId = data.cardlistInfo && data.cardlistInfo.since_id;
      const body = JSON.stringify({statuses, since_id: sinceId || 0, total_number: 100});
      console.log('[VVebo] Converted statuses count=' + statuses.length);
      finish({body});
    }
  } catch (err) {
    console.log('[VVebo] Response conversion error: ' + String(err));
    finish({});
  }
} else finish({});
