const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const api = {
  get: (u) => fetch(u).then(r => r.json()),
  post: (u, b) => fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: b ? JSON.stringify(b) : null }).then(r => r.json().catch(() => ({}))),
  del: (u) => fetch(u, { method: 'DELETE' }).then(r => r.json()),
};

let state = { iface: null, whitelist: [], scanSrc: null };

/* tabs */
$$('.tab').forEach(t => t.addEventListener('click', () => {
  $$('.tab').forEach(x => x.classList.toggle('active', x === t));
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + t.dataset.tab));
  if (t.dataset.tab === 'captures') refreshCaptures();
  if (t.dataset.tab === 'jobs') refreshJobs();
  if (t.dataset.tab === 'whitelist') refreshWhitelist();
}));

/* setup */
async function loadInterfaces() {
  const health = await api.get('/api/health');
  const tools = $('#tools');
  tools.innerHTML = '';
  Object.entries(health.tools).forEach(([k, v]) => {
    const el = document.createElement('span');
    el.className = 'pill ' + (v ? 'ok' : 'err');
    el.textContent = k;
    tools.appendChild(el);
  });

  const ifaces = await api.get('/api/interfaces');
  const sel = $('#iface');
  sel.innerHTML = '';
  if (!ifaces.length) {
    sel.innerHTML = '<option>no interfaces</option>';
    return;
  }
  ifaces.forEach(i => {
    const o = document.createElement('option');
    o.value = i.name;
    o.textContent = `${i.name}  (${i.type || '?'})`;
    sel.appendChild(o);
  });
  state.iface = sel.value;
}
$('#iface').addEventListener('change', e => state.iface = e.target.value);
$('#btn-refresh').addEventListener('click', loadInterfaces);
$('#btn-mon-start').addEventListener('click', async () => {
  const r = await api.post('/api/monitor/start', { iface: state.iface });
  $('#mon-out').textContent = r.out || '';
  loadInterfaces();
});
$('#btn-mon-stop').addEventListener('click', async () => {
  const r = await api.post('/api/monitor/stop', { iface: state.iface });
  $('#mon-out').textContent = r.out || '';
  loadInterfaces();
});

/* scan */
$('#btn-scan-start').addEventListener('click', async () => {
  await api.post('/api/scan/start', { iface: state.iface });
  $('#scan-status').textContent = 'scanning';
  $('#scan-status').className = 'pill ok';
  startStream();
});
$('#btn-scan-stop').addEventListener('click', async () => {
  await api.post('/api/scan/stop');
  stopStream();
  $('#scan-status').textContent = 'idle';
  $('#scan-status').className = 'pill';
});

function startStream() {
  stopStream();
  state.scanSrc = new EventSource('/api/scan/stream');
  state.scanSrc.onmessage = (ev) => {
    try { renderNets(JSON.parse(ev.data)); } catch {}
  };
}
function stopStream() {
  if (state.scanSrc) { state.scanSrc.close(); state.scanSrc = null; }
}

function renderNets(snap) {
  const wl = new Set(state.whitelist.map(w => w.bssid.toUpperCase()));
  const box = $('#nets');
  if (!snap.networks || !snap.networks.length) {
    box.innerHTML = '<p class="small">no networks yet…</p>';
    return;
  }
  box.innerHTML = '';
  snap.networks.forEach(n => {
    const el = document.createElement('div');
    el.className = 'card' + (wl.has(n.bssid.toUpperCase()) ? ' wl' : '');
    const clientCount = (snap.clients[n.bssid] || []).length;
    el.innerHTML = `
      <div class="top">
        <span class="essid">${esc(n.essid || '(hidden)')}</span>
        <span class="sig">${n.power} dBm</span>
      </div>
      <div class="bssid">${n.bssid}</div>
      <div class="meta">ch ${n.channel} · ${n.privacy} ${n.cipher} ${n.auth} · beacons ${n.beacons} · clients ${clientCount}</div>
    `;
    el.addEventListener('click', () => openTarget(n, snap.clients[n.bssid] || []));
    box.appendChild(el);
  });
}
function esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

/* target dialog */
let currentTarget = null;
function openTarget(net, clients) {
  currentTarget = { net, clients };
  const wl = new Set(state.whitelist.map(w => w.bssid.toUpperCase()));
  const isWL = wl.has(net.bssid.toUpperCase());
  $('#t-title').textContent = net.essid || '(hidden)';
  $('#t-info').innerHTML = `
    <div><b>BSSID:</b> ${net.bssid}</div>
    <div><b>Channel:</b> ${net.channel} · <b>${net.privacy}</b> ${net.cipher} ${net.auth}</div>
    <div><b>Signal:</b> ${net.power} dBm · <b>Clients:</b> ${clients.length}</div>
    ${clients.length ? '<div class="small">' + clients.map(c => c.mac).join(', ') + '</div>' : ''}
  `;
  $('#t-warn').classList.toggle('hidden', isWL);
  $('#t-handshake').disabled = !isWL;
  $('#t-pmkid').disabled = !isWL;
  $('#target-dlg').showModal();
}
$('#t-close').addEventListener('click', () => $('#target-dlg').close());
$('#t-whitelist').addEventListener('click', async () => {
  await api.post('/api/whitelist', { bssid: currentTarget.net.bssid, note: currentTarget.net.essid || '' });
  await refreshWhitelist();
  $('#target-dlg').close();
});
$('#t-handshake').addEventListener('click', async () => {
  const n = currentTarget.net;
  const r = await api.post('/api/attack/handshake', { iface: state.iface, bssid: n.bssid, channel: parseInt(n.channel) || 1, essid: n.essid });
  $('#target-dlg').close();
  gotoJobs();
  alert('Handshake job started: ' + (r.task_id || JSON.stringify(r)));
});
$('#t-pmkid').addEventListener('click', async () => {
  const n = currentTarget.net;
  const r = await api.post('/api/attack/pmkid', { iface: state.iface, bssid: n.bssid, essid: n.essid, duration: 60 });
  $('#target-dlg').close();
  gotoJobs();
  alert('PMKID job started: ' + (r.task_id || JSON.stringify(r)));
});
function gotoJobs() {
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'jobs'));
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'tab-jobs'));
  refreshJobs();
}

/* whitelist */
async function refreshWhitelist() {
  state.whitelist = await api.get('/api/whitelist');
  const box = $('#wl-list');
  box.innerHTML = '';
  if (!state.whitelist.length) {
    box.innerHTML = '<p class="small">empty — add BSSIDs you own</p>';
    return;
  }
  state.whitelist.forEach(w => {
    const el = document.createElement('div');
    el.className = 'wl-item';
    el.innerHTML = `
      <div><div class="bssid">${w.bssid}</div><div class="note">${esc(w.note || '')}</div></div>
      <button class="btn danger" data-bssid="${w.bssid}">Remove</button>
    `;
    el.querySelector('button').addEventListener('click', async e => {
      await api.del('/api/whitelist/' + encodeURIComponent(e.target.dataset.bssid));
      refreshWhitelist();
    });
    box.appendChild(el);
  });
}
$('#btn-wl-add').addEventListener('click', async () => {
  const b = $('#wl-bssid').value.trim();
  const n = $('#wl-note').value.trim();
  if (!/^[0-9a-f:]{17}$/i.test(b)) { alert('BSSID must be AA:BB:CC:DD:EE:FF'); return; }
  await api.post('/api/whitelist', { bssid: b, note: n });
  $('#wl-bssid').value = ''; $('#wl-note').value = '';
  refreshWhitelist();
});

/* captures */
async function refreshCaptures() {
  const caps = await api.get('/api/captures');
  const box = $('#captures');
  box.innerHTML = '';
  const hashSel = $('#crack-hash');
  hashSel.innerHTML = '';
  if (!caps.length) {
    box.innerHTML = '<p class="small">no captures yet</p>';
    return;
  }
  caps.forEach(c => {
    const el = document.createElement('div');
    el.className = 'cap-item';
    el.innerHTML = `<div><div>${c.name}</div><div class="small">${(c.size/1024).toFixed(1)} KB</div></div>
      <a href="/api/captures/${encodeURIComponent(c.name)}" download>download</a>`;
    box.appendChild(el);
    if (c.name.endsWith('.hc22000')) {
      const o = document.createElement('option');
      o.value = c.name; o.textContent = c.name;
      hashSel.appendChild(o);
    }
  });
}
$('#btn-cap-refresh').addEventListener('click', refreshCaptures);
$('#btn-crack').addEventListener('click', async () => {
  const h = $('#crack-hash').value;
  const w = $('#crack-wordlist').value;
  if (!h) { alert('no .hc22000 file to crack'); return; }
  const r = await api.post('/api/crack', { hash_file: h, wordlist: w });
  gotoJobs();
  alert('Crack job started: ' + (r.task_id || JSON.stringify(r)));
});

/* jobs */
async function refreshJobs() {
  const js = await api.get('/api/tasks');
  const box = $('#jobs');
  box.innerHTML = '';
  if (!js.length) { box.innerHTML = '<p class="small">no jobs yet</p>'; return; }
  js.sort((a, b) => b.started - a.started);
  js.forEach(j => {
    const el = document.createElement('div');
    el.className = 'job ' + j.status;
    const tail = (j.log || []).slice(-30).join('\n');
    const res = j.result ? `<div class="result">${esc(JSON.stringify(j.result))}</div>` : '';
    el.innerHTML = `
      <div class="hdr">
        <div><b>${j.kind}</b> <span class="small">${j.id}</span></div>
        <div class="status">${j.status}</div>
      </div>
      <div class="small">${esc(JSON.stringify(j.meta))}</div>
      ${res}
      <pre>${esc(tail)}</pre>
    `;
    box.appendChild(el);
  });
}
$('#btn-jobs-refresh').addEventListener('click', refreshJobs);
setInterval(() => { if ($('#tab-jobs').classList.contains('active')) refreshJobs(); }, 3000);

/* init */
loadInterfaces();
refreshWhitelist();
