// VVebo Shadowrocket diagnostic adapter
const UID_KEY = 'vvebo_target_uid';
const url = $request.url;
const isRequest = typeof $response === 'undefined';
function uidFromUrl(s) { const m = s.match(/[?&]uid=(\d+)(?:&|$)/); return m ? m[1] : null; }
function notify(title, detail) { console.log('[VVebo] ' + title + ': ' + detail); }
function finish(x) { $done(x || {}); }
if (isRequest) {
  if (/\/2\/users\/show\?/.test(url)) {
    const uid = uidFromUrl(url);
    if (uid) { $persistentStore.write(uid, UID_KEY); notify('捕获用户 UID', uid); }
    finish({});
  } else if (/\/2\/statuses\/user_timeline\?/.test(url)) {
    const uid = uidFromUrl(url) || $persistentStore.read(UID_KEY);
    if (!uid) { notify('请求改写失败', '未取得 UID'); finish({}); }
    else {
      let next = url.replace('/2/statuses/user_timeline?', '/2/profile/statuses/tab?');
      next = next.replace(/([?&])max_id=/, '$1since_id=');
      if (!uidFromUrl(next)) next += '&uid=' + encodeURIComponent(uid);
      if (!/[?&]containerid=/.test(next)) next += '&containerid=' + encodeURIComponent('230413' + uid + '_-_WEIBO_SECOND_PROFILE_WEIBO');
      notify('请求改写', 'UID=' + uid + ' → profile/statuses/tab');
      finish({url: next});
    }
  } else finish({});
} else if (/\/2\/(?:profile\/statuses\/tab|statuses\/user_timeline)\?/.test(url)) {
  try {
    const data = JSON.parse($response.body || '{}');
    const cards = Array.isArray(data.cards) ? data.cards : (data.data && Array.isArray(data.data.cards) ? data.data.cards : null);
    if (!cards) { notify('响应无 cards', '顶层字段=' + Object.keys(data).slice(0, 8).join(',')); finish({}); }
    else {
      const flat = cards.flatMap(c => Array.isArray(c.card_group) ? c.card_group : [c]);
      const statuses = flat.filter(c => c && Number(c.card_type) === 9 && c.mblog).map(c => c.mblog);
      const page = data.cardlistInfo || (data.data && data.data.cardlistInfo) || {};
      const body = JSON.stringify({statuses, since_id: page.since_id || 0, total_number: 100});
      notify('响应转换完成', 'cards=' + cards.length + ', statuses=' + statuses.length + ', URL=' + (url.includes('profile/statuses/tab') ? 'profile' : 'timeline'));
      finish({body});
    }
  } catch (err) { notify('响应转换错误', String(err).slice(0, 180)); finish({}); }
} else finish({});
