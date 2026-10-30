// Shadowrocket HTTP request script. Experimental UID handoff.
const KEY = 'vvebo_target_uid';
const url = $request.url;
const match = url.match(/[?&]uid=(\d+)(?:&|$)/);
if (/\/2\/users\/show\?/.test(url)) {
  if (match) $persistentStore.write(match[1], KEY);
  $done({});
} else if (/\/2\/statuses\/user_timeline\?/.test(url)) {
  const uid = $persistentStore.read(KEY);
  if (!match && uid) {
    $done({url: url + '&uid=' + encodeURIComponent(uid)});
  } else $done({});
} else $done({});
