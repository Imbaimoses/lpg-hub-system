/* LPG Cylinder Inventory — Colorful UI (v4)
   - Single-page front-end using localStorage
   - QR generation with QRious, scanning with html5-qrcode
   - Save as index.html, styles.css, app.js and run via http://localhost for camera.
*/

const STORAGE_KEY = 'cylinders_v4';
const BRANDS = ['PayGo','Wajiko','GreenWells'];
const STATUSES = ['Full','Empty'];

// DOM
const content = document.getElementById('content');
const btnIn = document.getElementById('nav-in');
const btnOut = document.getElementById('nav-out');
const btnInv = document.getElementById('nav-inv');
const btnAdd = document.getElementById('btn-add');
const globalSearch = document.getElementById('global-search');
const statsBox = document.getElementById('stats');

const drawerIn = document.getElementById('drawer-in');
const drawerOut = document.getElementById('drawer-out');
const drawerInClose = document.getElementById('drawer-in-close');
const drawerOutClose = document.getElementById('drawer-out-close');

const inRegister = document.getElementById('in-register');
const inCancel = document.getElementById('in-cancel');

const modeScan = document.getElementById('mode-scan');
const modeType = document.getElementById('mode-type');
const scanArea = document.getElementById('scan-area');
const typeArea = document.getElementById('type-area');
const outFind = document.getElementById('out-find');
const outCancel = document.getElementById('out-cancel');
const stopScan = document.getElementById('stop-scan');
const outResult = document.getElementById('out-result');

const qrModal = document.getElementById('qr-modal');
const qrModalContent = document.getElementById('qr-modal-content');
const qrClose = document.getElementById('qr-close');
const qrDownload = document.getElementById('qr-download');

let html5QrScanner = null;
let lastGeneratedDataUrl = null;

// Navigation
btnIn.addEventListener('click', () => openDrawer('in'));
btnOut.addEventListener('click', () => openDrawer('out'));
btnInv.addEventListener('click', () => showInventory());
btnAdd.addEventListener('click', () => openDrawer('in'));

drawerInClose.addEventListener('click', () => closeDrawer('in'));
drawerOutClose.addEventListener('click', () => closeDrawer('out'));
inCancel.addEventListener('click', () => closeDrawer('in'));

modeScan.addEventListener('click', startOutScanMode);
modeType.addEventListener('click', startOutTypeMode);
stopScan.addEventListener('click', stopQrCamera);
outCancel.addEventListener('click', () => closeDrawer('out'));
outFind.addEventListener('click', () => {
  const val = (document.getElementById('out-glp').value || '').trim().toUpperCase();
  findOutByGlp(val);
});

// QR modal
qrClose.addEventListener('click', () => qrModal.classList.add('hidden'));
qrDownload.addEventListener('click', () => {
  if(!lastGeneratedDataUrl) return;
  const a = document.createElement('a');
  a.href = lastGeneratedDataUrl; a.download = 'qr.png'; a.click();
});

// Search
globalSearch.addEventListener('input', () => showInventory());

// initial view
showInventory();
updateStats();

// ---------- Storage ----------
function loadCylinders(){ try{ const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : []; } catch(e){ return []; } }
function saveCylinders(arr){ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }

// ---------- Drawer: Scan IN ----------
function openDrawer(which){
  if(which === 'in'){
    drawerIn.classList.remove('hidden');
    // reset fields
    document.getElementById('in-glp').value = '';
    document.getElementById('in-weight').value = '';
    document.getElementById('in-status').value = 'Full';
    document.getElementById('in-brand').value = 'PayGo';
    hideErr('err-glp'); hideErr('err-weight');
    inRegister.onclick = registerCylinder;
  } else {
    drawerOut.classList.remove('hidden');
    hideAllOutAreas();
    outResult.innerHTML = '';
  }
}

function closeDrawer(which){
  if(which === 'in') drawerIn.classList.add('hidden');
  else drawerOut.classList.add('hidden');
  stopQrCamera();
}

function hideErr(id){ const e = document.getElementById(id); if(e){ e.style.display='none'; e.textContent=''; } }
function showErr(id,msg){ const e = document.getElementById(id); if(e){ e.style.display='block'; e.textContent=msg; } }

function registerCylinder(){
  const glp = (document.getElementById('in-glp').value || '').trim().toUpperCase();
  const status = document.getElementById('in-status').value;
  const brand = document.getElementById('in-brand').value;
  const weightRaw = document.getElementById('in-weight').value;
  const weight = weightRaw === '' ? null : Number(weightRaw);

  hideErr('err-glp'); hideErr('err-weight');

  if(!glp){ showErr('err-glp','GLP Code required.'); return; }
  if(!/^GLP[0-9A-Z]*$/i.test(glp)){ showErr('err-glp','GLP must start with "GLP" and be alphanumeric.'); return; }
  if(!BRANDS.includes(brand)){ alert('Invalid brand'); return; }
  if(!STATUSES.includes(status)){ alert('Invalid status'); return; }
  if(weight === null || Number.isNaN(weight)){ showErr('err-weight','Weight required.'); return; }

  if(status === 'Full'){
    if(!(weight >= 24.0 && weight <= 25.0)){ showErr('err-weight','Full weight must be 24.0–25.0 kg.'); return; }
  } else {
    if(!(weight >= 11.0 && weight <= 25.0)){ showErr('err-weight','Empty weight must be 11.0–25.0 kg.'); return; }
  }

  const arr = loadCylinders();
  if(arr.some(c => c.glp.toUpperCase() === glp && c.state === 'IN')){ showErr('err-glp','GLP already active.'); return; }

  const newC = { glp: glp.toUpperCase(), brand, weight: Number(weight.toFixed(1)), status, state: 'IN', createdAt: new Date().toISOString() };
  arr.push(newC); saveCylinders(arr);
  closeDrawer('in');
  showInventory(); updateStats();
  toast('Cylinder registered');
}

// ---------- Inventory UI ----------
function showInventory(){
  // active nav
  btnInv.classList.add('active'); btnIn.classList.remove('active'); btnOut.classList.remove('active');

  const arr = loadCylinders();
  const active = arr.filter(c => c.state === 'IN');

  content.innerHTML = `
    <div class="header-row">
      <div>
        <h2 style="margin:0">Inventory</h2>
        <div class="small muted">Active cylinders (state = IN)</div>
        <div class="tabs" id="main-tabs" style="margin-top:10px">
          <button class="tab active" data-tab="all">All</button>
          <button class="tab" data-tab="full">Full</button>
          <button class="tab" data-tab="empty">Empty</button>
        </div>
        <div class="subtabs" id="brand-subtabs" style="margin-top:8px;display:none">
          <button class="subtab active" data-brand="all">All Brands</button>
          <button class="subtab" data-brand="PayGo">PayGo</button>
          <button class="subtab" data-brand="Wajiko">Wajiko</button>
          <button class="subtab" data-brand="GreenWells">GreenWells</button>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
        <div class="small muted">Totals</div>
        <div style="display:flex;gap:8px">
          <div class="stat"><strong>${active.length}</strong><div class="small muted">In Stock</div></div>
          <div class="stat"><strong>${active.filter(x=>x.status==='Full').length}</strong><div class="small muted">Full</div></div>
          <div class="stat"><strong>${active.filter(x=>x.status==='Empty').length}</strong><div class="small muted">Empty</div></div>
        </div>
      </div>
    </div>

    <div id="cards" class="cards"></div>
  `;

  // tab handlers
  document.querySelectorAll('#main-tabs .tab').forEach(t => t.addEventListener('click', e => {
    document.querySelectorAll('#main-tabs .tab').forEach(x=>x.classList.remove('active'));
    e.currentTarget.classList.add('active');
    document.getElementById('brand-subtabs').style.display = (e.currentTarget.dataset.tab === 'all') ? 'none' : 'flex';
    // reset subtabs
    document.querySelectorAll('.subtab').forEach(s=>s.classList.remove('active'));
    document.querySelector('.subtab[data-brand="all"]').classList.add('active');
    renderCards();
  }));
  document.querySelectorAll('.subtab').forEach(s => s.addEventListener('click', e => {
    document.querySelectorAll('.subtab').forEach(x=>x.classList.remove('active'));
    e.currentTarget.classList.add('active');
    renderCards();
  }));

  document.getElementById('global-search').value = '';
  document.getElementById('global-search').oninput = () => renderCards();

  document.getElementById('btn-add').onclick = () => openDrawer('in');

  renderCards();

  function renderCards(){
    const tab = document.querySelector('#main-tabs .tab.active').dataset.tab;
    const brand = document.querySelector('.subtab.active') ? document.querySelector('.subtab.active').dataset.brand : 'all';
    const q = (document.getElementById('global-search').value || '').trim().toUpperCase();

    let filtered = active.slice();
    if(tab === 'full') filtered = filtered.filter(c => c.status === 'Full');
    if(tab === 'empty') filtered = filtered.filter(c => c.status === 'Empty');
    if(brand && brand !== 'all') filtered = filtered.filter(c => c.brand === brand);
    if(q) filtered = filtered.filter(c => c.glp.includes(q) || c.brand.toUpperCase().includes(q));

    const cards = document.getElementById('cards'); cards.innerHTML = '';
    if(filtered.length === 0){ cards.innerHTML = '<div class="small muted">No cylinders here.</div>'; return; }

    filtered.forEach(c => {
      const card = document.createElement('div'); card.className = 'card';
      card.innerHTML = `
        <div class="card-top">
          <div>
            <div class="glp">${c.glp}</div>
            <div class="meta">${c.brand} • ${c.weight.toFixed(1)} kg • ${c.status}</div>
            <div class="small muted">Added: ${new Date(c.createdAt).toLocaleString()}</div>
          </div>
          <div style="text-align:right">
            <div class="small muted">${c.status}</div>
          </div>
        </div>

        <div class="qr-row">
          <div class="qr" id="qr-${escapeId(c.glp)}"></div>
          <div style="flex:1;display:flex;flex-direction:column;gap:8px;align-items:flex-end">
            <div>
              <button class="btn primary scan-out" data-glp="${c.glp}">Scan OUT</button>
              <button class="btn ghost enlarge-qr" data-glp="${c.glp}">Enlarge</button>
            </div>
            <div class="small muted">QR is scannable from your laptop screen</div>
          </div>
        </div>
      `;
      cards.appendChild(card);
      generateQRCodeInto(c.glp, card.querySelector(`#qr-${escapeId(c.glp)}`));

      card.querySelector('.scan-out').addEventListener('click', (e) => openDrawerOutForGLP(e.currentTarget.dataset.glp));
      card.querySelector('.enlarge-qr').addEventListener('click', () => showQrModal(c.glp));
    });
  }
}

// ---------- Scan OUT ----------
function hideAllOutAreas(){
  scanArea.classList.add('hidden'); typeArea.classList.add('hidden');
}
function startOutScanMode(){
  hideAllOutAreas(); scanArea.classList.remove('hidden'); outResult.innerHTML = '';
  startQrCamera((decoded) => {
    const val = String(decoded || '').trim().toUpperCase();
    if(!val.startsWith('GLP')){ toast('Not a cylinder (must start with GLP)', {type:'error'}); return; }
    stopQrCamera();
    showOutResult(val);
  });
}
function startOutTypeMode(){
  hideAllOutAreas(); typeArea.classList.remove('hidden'); outResult.innerHTML = '';
  document.getElementById('out-glp').value = '';
}
function closeDrawerOut(){
  closeDrawer('out');
  hideAllOutAreas();
  outResult.innerHTML = '';
}

function findOutByGlp(val){
  if(!val){ showErr('err-out-glp','Enter GLP'); return; }
  if(!/^GLP[0-9A-Z]*$/i.test(val)){ showErr('err-out-glp','GLP must start with "GLP".'); return; }
  showOutResult(val.toUpperCase());
}

function openDrawerOutForGLP(glp){
  drawerOut.classList.remove('hidden'); hideAllOutAreas();
  showOutResult(glp);
}

function showOutResult(glp){
  const arr = loadCylinders();
  const found = arr.find(c => c.glp.toUpperCase() === glp.toUpperCase() && c.state === 'IN');
  outResult.innerHTML = '';
  if(!found){ outResult.innerHTML = `<div class="small muted">Cylinder ${glp} not found in active inventory.</div>`; return; }

  const div = document.createElement('div'); div.className = 'panel';
  div.innerHTML = `
    <div style="display:flex;gap:12px;align-items:center">
      <div class="qr" id="out-qr-${escapeId(found.glp)}" style="width:160px;height:160px"></div>
      <div>
        <div style="font-weight:900">${found.glp}</div>
        <div class="meta">${found.brand} • ${found.weight.toFixed(1)} kg • ${found.status}</div>
        <div class="small muted">Added: ${new Date(found.createdAt).toLocaleString()}</div>
        <div style="margin-top:10px">
          <button id="confirm-out" class="btn primary">CONFIRM SCAN OUT</button>
          <button id="cancel-out" class="btn ghost">CANCEL</button>
        </div>
      </div>
    </div>
  `;
  outResult.appendChild(div);
  generateQRCodeInto(found.glp, div.querySelector(`#out-qr-${escapeId(found.glp)}`));
  document.getElementById('cancel-out').onclick = () => closeDrawer('out');
  document.getElementById('confirm-out').onclick = () => {
    const idx = arr.findIndex(c => c.glp.toUpperCase() === found.glp.toUpperCase() && c.state === 'IN');
    if(idx === -1){ toast('Cylinder not available', {type:'error'}); return; }
    arr[idx].state = 'OUT'; saveCylinders(arr);
    toast('Cylinder marked OUT'); closeDrawer('out'); showInventory(); updateStats();
  };
}

// ---------- QR: generate / scan helpers ----------
function generateQRCodeInto(text, container){
  container.innerHTML = '';
  const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 640;
  new QRious({ element: canvas, value: text, size: 640, level: 'H' });
  const img = document.createElement('img'); img.src = canvas.toDataURL('image/png'); img.alt = 'QR ' + text;
  img.style.width = container.style.width || '120px'; img.style.height = container.style.height || '120px';
  container.appendChild(img);
  // keep last generated for export if from modal
  lastGeneratedDataUrl = img.src;
}

function startQrCamera(onDetected){
  const qrReaderDiv = document.getElementById('qr-reader');
  if(!qrReaderDiv) return;
  qrReaderDiv.innerHTML = 'Starting camera…';
  Html5Qrcode.getCameras().then(cameras => {
    if(!cameras || cameras.length === 0){ qrReaderDiv.innerHTML = 'No camera found'; return; }
    const cam = cameras.find(c=> /back|rear|environment/i.test(c.label)) || cameras[0];
    html5QrScanner = new Html5Qrcode('qr-reader');
    html5QrScanner.start(cam.id, { fps: 8, qrbox: 250 }, qrMessage => {
      onDetected(qrMessage);
    }, errorMessage => { /* scanning */ }).catch(err => {
      qrReaderDiv.innerHTML = 'Camera start failed: ' + err;
    });
  }).catch(err => { qrReaderDiv.innerHTML = 'Camera error: ' + err; });
}

function stopQrCamera(){
  if(html5QrScanner){
    html5QrScanner.stop().then(() => html5QrScanner.clear()).catch(()=>{}).finally(()=>{ html5QrScanner = null; });
  }
}

// ---------- small UI helpers ----------
function escapeId(s){ return s.replace(/[^a-z0-9_\-]/ig, '_'); }
function toast(msg, {type='info', duration=1400} = {}) {
  const t = document.createElement('div'); t.textContent = msg;
  t.style.position='fixed'; t.style.right='20px'; t.style.top='20px'; t.style.padding='10px 14px';
  t.style.borderRadius='10px'; t.style.color='white'; t.style.zIndex=9999; t.style.fontWeight=800;
  t.style.background = type==='error' ? 'linear-gradient(90deg,#ef4444,#dc2626)' : (type==='success' ? 'linear-gradient(90deg,#16a34a,#198754)' : 'linear-gradient(90deg,#4a2bd8,#6c5ce7)');
  document.body.appendChild(t); setTimeout(()=>{ t.style.transition='opacity .2s'; t.style.opacity='0'; setTimeout(()=>t.remove(),220); }, duration);
}

function showQrModal(glp){
  qrModal.classList.remove('hidden'); qrModalContent.innerHTML = ''; generateQRCodeInto(glp, qrModalContent);
}

function updateStats(){
  const arr = loadCylinders();
  const inCount = arr.filter(c=>c.state==='IN').length;
  const full = arr.filter(c=>c.state==='IN' && c.status==='Full').length;
  const empty = arr.filter(c=>c.state==='IN' && c.status==='Empty').length;
  statsBox.innerHTML = `<div style="text-align:right"><div style="font-weight:900">${inCount}</div><div style="font-size:12px;color:${getComputedStyle(document.documentElement).getPropertyValue('--muted')}">In Stock</div></div>`;
}

// stop camera when leaving
window.addEventListener('beforeunload', () => stopQrCamera());
window.addEventListener('visibilitychange', () => { if(document.hidden) stopQrCamera(); });
