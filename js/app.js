// Modern UI LPG Cylinder Inventory (localStorage)
// Preserves rules: brands, weight ranges, QR generation (content = GLP), scan out, inventory tabs.
// Improved UI navigation and camera handling.

const STORAGE_KEY = 'cylinders_v2';
const BRANDS = ['PayGo','Wajiko','GreenWells'];
const STATUSES = ['Full','Empty'];

// Simple client-side "router" for screens
const view = document.getElementById('view');
const navIn = document.getElementById('nav-in');
const navOut = document.getElementById('nav-out');
const navInv = document.getElementById('nav-inv');

navIn.addEventListener('click', () => navigate('in'));
navOut.addEventListener('click', () => navigate('out'));
navInv.addEventListener('click', () => navigate('inv'));

// initial
navigate('inv');

// storage helpers
function loadCylinders(){ try{ const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : []; } catch(e){ return []; } }
function saveCylinders(arr){ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }

// navigation and active nav button
function setActiveNav(key){
  navIn.classList.toggle('active', key==='in');
  navOut.classList.toggle('active', key==='out');
  navInv.classList.toggle('active', key==='inv');
  navIn.setAttribute('aria-pressed', key==='in');
  navOut.setAttribute('aria-pressed', key==='out');
  navInv.setAttribute('aria-pressed', key==='inv');
}

function navigate(screen){
  setActiveNav(screen);
  if(screen === 'in') renderScanIn();
  if(screen === 'out') renderScanOut();
  if(screen === 'inv') renderInventory();
}

/* ---------------- SCAN IN ---------------- */
function renderScanIn(){
  view.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'view-screen panel-lg active';
  container.innerHTML = `
    <h2>Scan IN — Register Cylinder</h2>
    <p class="small">Register a cylinder into stock. Duplicate active GLP codes are prevented.</p>

    <div class="panel" id="form-panel">
      <div class="form-row">
        <label for="glp">GLP Code</label>
        <input id="glp" type="text" placeholder="GLPKEH06779F" />
        <div id="glp-err" class="small" style="color:#b91c1c;display:none"></div>
      </div>

      <div class="form-row inline" style="gap:10px">
        <div style="flex:1">
          <label for="brand">Brand</label>
          <select id="brand"></select>
        </div>
        <div style="width:160px">
          <label for="status">Status</label>
          <select id="status"></select>
        </div>
      </div>

      <div class="form-row">
        <label for="weight">Weight (kg)</label>
        <input id="weight" type="number" step="0.1" />
        <div id="weight-err" class="small" style="color:#b91c1c;display:none"></div>
      </div>

      <div style="display:flex;gap:10px;margin-top:12px">
        <button id="register" class="btn btn-primary">REGISTER CYLINDER</button>
        <button id="cancel" class="btn btn-ghost">CANCEL</button>
      </div>
      <div class="small" style="margin-top:10px;color:var(--muted)">
        Brands allowed: PayGo, Wajiko, GreenWells • Full weight: 24.0–25.0 kg • Empty weight: 11.0–25.0 kg
      </div>
    </div>
  `;
  view.appendChild(container);

  // populate selects
  const brandSel = container.querySelector('#brand');
  BRANDS.forEach(b => { const o = document.createElement('option'); o.value = b; o.textContent = b; brandSel.appendChild(o); });
  const statusSel = container.querySelector('#status');
  STATUSES.forEach(s => { const o = document.createElement('option'); o.value = s; o.textContent = s; statusSel.appendChild(o); });

  container.querySelector('#cancel').addEventListener('click', () => navigate('inv'));
  container.querySelector('#register').addEventListener('click', () => {
    const glpIn = container.querySelector('#glp').value.trim().toUpperCase();
    const brand = brandSel.value;
    const status = statusSel.value;
    const weightVal = container.querySelector('#weight').value;
    const weight = weightVal === '' ? null : Number(weightVal);

    // clear previous errors
    container.querySelector('#glp-err').style.display='none';
    container.querySelector('#weight-err').style.display='none';

    const err = validateScanIn(glpIn, brand, status, weight);
    if(err){
      if(err.field === 'glp'){ showErr('#glp-err', err.msg); return; }
      if(err.field === 'weight'){ showErr('#weight-err', err.msg); return; }
      alert(err.msg);
      return;
    }

    // unique active GLP check
    const arr = loadCylinders();
    if(arr.some(c => c.glp === glpIn && c.state === 'IN')){
      showErr('#glp-err', 'A cylinder with this GLP is already active (state = IN).');
      return;
    }

    const newC = { glp: glpIn, brand, weight, status, state: 'IN', createdAt: new Date().toISOString() };
    arr.push(newC);
    saveCylinders(arr);
    // nice success callout
    flashMessage('Cylinder registered', {type:'success'});
    navigate('inv');
  });
}

function showErr(sel, msg){ const el = document.querySelector(sel); if(!el) return; el.textContent = msg; el.style.display = 'block'; }

function validateScanIn(glp, brand, status, weight){
  if(!glp) return {field:'glp', msg:'GLP Code is required.'};
  if(!/^[A-Za-z0-9]+$/.test(glp)) return {field:'glp', msg:'GLP must be letters and digits only (no spaces).'};
  if(!BRANDS.includes(brand)) return {msg:'Brand invalid.'};
  if(!STATUSES.includes(status)) return {msg:'Status invalid.'};
  if(weight === null || Number.isNaN(weight)) return {field:'weight', msg:'Weight is required.'};
  const w = Number(weight);
  if(status === 'Full'){
    if(!(w >= 24.0 && w <= 25.0)) return {field:'weight', msg:'Full: weight must be between 24.0 and 25.0 kg.'};
  } else {
    if(!(w >= 11.0 && w <= 25.0)) return {field:'weight', msg:'Empty: weight must be between 11.0 and 25.0 kg.'};
  }
  return null;
}

/* ---------------- INVENTORY ---------------- */
function renderInventory(){
  view.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'view-screen active';
  container.innerHTML = `
    <div class="inventory-header">
      <div>
        <h2>Inventory</h2>
        <div class="small">Only cylinders with state = IN are listed. Click QR to enlarge or Scan OUT to remove.</div>
      </div>

      <div class="controls">
        <input id="search" class="search" placeholder="Search GLP or Brand..." />
      </div>
    </div>

    <div class="counters" id="counters-root"></div>

    <div class="tabs" id="tab-root">
      <button class="tab active" data-tab="all">All</button>
      <button class="tab" data-tab="full">Full</button>
      <button class="tab" data-tab="empty">Empty</button>
    </div>

    <div class="cards" id="cards-root"></div>
  `;
  view.appendChild(container);

  // events
  container.querySelector('#search').addEventListener('input', () => refreshInventory());
  container.querySelectorAll('.tab').forEach(t => t.addEventListener('click', (e) => {
    container.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    e.currentTarget.classList.add('active');
    refreshInventory();
  }));

  refreshInventory();
}

function refreshInventory(){
  const arr = loadCylinders();
  const active = arr.filter(c => c.state === 'IN');
  const countersRoot = document.getElementById('counters-root');
  countersRoot.innerHTML = '';
  countersRoot.appendChild(counter('Total In Stock', active.length));
  countersRoot.appendChild(counter('Full', active.filter(x=>x.status==='Full').length));
  countersRoot.appendChild(counter('Empty', active.filter(x=>x.status==='Empty').length));
  countersRoot.appendChild(counter('Scanned Out', arr.filter(x=>x.state==='OUT').length));

  const tab = document.querySelector('.tab.active').dataset.tab;
  const search = (document.getElementById('search').value || '').trim().toUpperCase();

  let filtered = active.filter(c => {
    if(tab === 'full') return c.status === 'Full';
    if(tab === 'empty') return c.status === 'Empty';
    return true;
  });
  if(search){
    filtered = filtered.filter(c => c.glp.includes(search) || c.brand.toUpperCase().includes(search));
  }

  const cardsRoot = document.getElementById('cards-root');
  cardsRoot.innerHTML = '';
  if(filtered.length === 0){
    cardsRoot.innerHTML = `<div class="small">No cylinders in this view.</div>`; return;
  }
  filtered.forEach(c => cardsRoot.appendChild(cardElement(c)));
}

function counter(label, num){
  const el = document.createElement('div');
  el.className = 'counter';
  el.innerHTML = `<div class="num">${num}</div><div class="label">${label}</div>`;
  return el;
}

function cardElement(cyl){
  const el = document.createElement('div'); el.className = 'card';
  el.innerHTML = `
    <div class="top">
      <div>
        <div class="glp">${cyl.glp}</div>
        <div class="meta">${cyl.brand} • ${cyl.weight.toFixed(1)} kg • ${cyl.status}</div>
      </div>
      <div class="small muted">${new Date(cyl.createdAt).toLocaleString()}</div>
    </div>

    <div class="qr-wrap">
      <div class="qr-img" id="qr-${escapeId(cyl.glp)}" title="QR for ${cyl.glp}"></div>
      <div style="flex:1">
        <div style="margin-bottom:8px" class="small">Tap Scan OUT to remove from stock.</div>
        <div class="actions">
          <button class="btn btn-primary btn-scan-out" data-glp="${cyl.glp}">Scan OUT</button>
          <button class="btn btn-ghost btn-enlarge" data-glp="${cyl.glp}">Enlarge QR</button>
        </div>
      </div>
    </div>
  `;
  generateQRCodeInto(cyl.glp, el.querySelector(`#qr-${escapeId(cyl.glp)}`));
  el.querySelector('.btn-scan-out').addEventListener('click', () => confirmScanOut(cyl.glp));
  el.querySelector('.btn-enlarge').addEventListener('click', () => showQrModal(cyl.glp));
  return el;
}

/* ---------------- SCAN OUT ---------------- */
let html5QrScanner = null;
function renderScanOut(){
  view.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'view-screen panel-lg active';
  container.innerHTML = `
    <h2>Scan OUT — Remove Cylinder</h2>
    <p class="small">Use camera to scan a QR, or enter the GLP code manually.</p>

    <div class="panel" style="display:flex;gap:12px;flex-direction:column">
      <div id="qr-reader" style="min-height:160px;border-radius:10px;padding:8px;background:#0b1320;color:white;display:flex;align-items:center;justify-content:center">
        <div class="qr-hint">Starting camera…</div>
      </div>

      <div style="display:flex;gap:10px;align-items:center">
        <input id="out-glp" type="text" placeholder="Enter GLP code" style="flex:1;padding:10px;border-radius:10px;border:1px solid #e6eefc" />
        <button id="out-search" class="btn btn-primary">SEARCH</button>
        <button id="out-cancel" class="btn btn-ghost">CANCEL</button>
      </div>

      <div id="out-result"></div>
    </div>
  `;
  view.appendChild(container);

  document.getElementById('out-cancel').addEventListener('click', () => { stopQrCamera(); navigate('inv'); });
  document.getElementById('out-search').addEventListener('click', () => {
    const glp = (document.getElementById('out-glp').value || '').trim().toUpperCase();
    if(!glp){ flashMessage('Enter GLP or scan QR', {type:'error'}); return; }
    findAndShowOut(glp);
  });

  // start camera scanner
  startQrCamera((decoded) => {
    stopQrCamera();
    findAndShowOut(decoded.trim().toUpperCase());
  });
}

// camera helpers with improved error handling
function startQrCamera(onDetected){
  const reader = document.getElementById('qr-reader');
  if(!reader) return;
  reader.innerHTML = `<div class="qr-hint">Searching for camera…</div>`;

  Html5Qrcode.getCameras().then(cameras => {
    if(!cameras || cameras.length === 0){
      reader.innerHTML = `<div class="qr-hint">No camera found. Use manual GLP entry.</div>`; return;
    }
    // pick back camera if available
    const cam = cameras.find(c => /back|rear|environment/i.test(c.label)) || cameras[0];
    html5QrScanner = new Html5Qrcode("qr-reader");
    html5QrScanner.start(cam.id, { fps: 10, qrbox: 250 },
      qrMessage => { onDetected(qrMessage); },
      error => { /* scanner ongoing */ }
    ).catch(err => {
      reader.innerHTML = `<div class="qr-hint">Camera start failed: ${String(err)} — use manual entry.</div>`;
    });
  }).catch(err => {
    reader.innerHTML = `<div class="qr-hint">Camera error: ${String(err)} — use manual entry.</div>`;
  });
}

function stopQrCamera(){
  if(html5QrScanner){
    html5QrScanner.stop().then(() => { html5QrScanner.clear(); html5QrScanner = null; }).catch(()=>{ html5QrScanner = null; });
  }
}

function findAndShowOut(glp){
  const arr = loadCylinders();
  const found = arr.find(c => c.glp === glp && c.state === 'IN');
  const root = document.getElementById('out-result');
  root.innerHTML = '';
  if(!found){
    root.innerHTML = `<div class="small" style="color:var(--muted)">Cylinder ${glp} not found in active stock.</div>`; return;
  }
  const el = document.createElement('div'); el.className = 'panel';
  el.innerHTML = `
    <div style="display:flex;gap:12px;align-items:center">
      <div class="qr-img" id="out-qr-${escapeId(glp)}" style="width:160px;height:160px"></div>
      <div>
        <div style="font-weight:800">${found.glp}</div>
        <div class="small" style="margin-bottom:8px">${found.brand} • ${found.weight.toFixed(1)} kg • ${found.status}</div>
        <div style="display:flex;gap:8px">
          <button id="confirm-out" class="btn btn-danger">CONFIRM SCAN OUT</button>
          <button id="cancel-out" class="btn btn-ghost">CANCEL</button>
        </div>
      </div>
    </div>
  `;
  root.appendChild(el);
  generateQRCodeInto(found.glp, document.getElementById(`out-qr-${escapeId(glp)}`));
  document.getElementById('cancel-out').addEventListener('click', () => { stopQrCamera(); navigate('inv'); });
  document.getElementById('confirm-out').addEventListener('click', () => {
    const idx = arr.findIndex(c => c.glp === glp && c.state === 'IN');
    if(idx === -1){ flashMessage('Cylinder not found', {type:'error'}); navigate('inv'); return; }
    arr[idx].state = 'OUT';
    saveCylinders(arr);
    flashMessage('Cylinder marked OUT', {type:'success'});
    stopQrCamera();
    navigate('inv');
  });
}

/* ---------------- Utilities & small UI helpers ---------------- */
function generateQRCodeInto(text, container){
  container.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.width = 480; canvas.height = 480;
  new QRious({ element: canvas, value: text, size: 480, level: 'H' });
  const img = document.createElement('img');
  img.src = canvas.toDataURL('image/png');
  img.style.width = container.style.width || '120px';
  img.style.height = container.style.height || '120px';
  img.alt = 'QR ' + text;
  container.appendChild(img);
}

// small flash message toast
function flashMessage(msg, {type='info', duration=1600} = {}){
  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.right = '18px';
  toast.style.top = '18px';
  toast.style.zIndex = 9999;
  toast.style.padding = '12px 16px';
  toast.style.borderRadius = '10px';
  toast.style.boxShadow = '0 6px 20px rgba(10,15,30,0.2)';
  toast.style.color = 'white';
  toast.style.fontWeight = 700;
  toast.style.background = type === 'success' ? 'linear-gradient(90deg,#16a34a,#198754)' : (type === 'error' ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'linear-gradient(90deg,#0b5ed7,#0a58ca)');
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(()=>{ toast.style.transition='opacity 220ms'; toast.style.opacity='0'; setTimeout(()=>toast.remove(),260); }, duration);
}

// confirm from inventory card
function confirmScanOut(glp){
  if(!confirm(`Confirm Scan OUT for ${glp}?`)) return;
  const arr = loadCylinders();
  const idx = arr.findIndex(c => c.glp === glp && c.state === 'IN');
  if(idx === -1){ flashMessage('Cylinder not found', {type:'error'}); refreshInventory(); return; }
  arr[idx].state = 'OUT';
  saveCylinders(arr);
  flashMessage('Cylinder marked OUT', {type:'success'});
  refreshInventory();
}

// modal for QR enlarge
function showQrModal(glp){
  const backdrop = document.createElement('div'); backdrop.className = 'modal-backdrop';
  const card = document.createElement('div'); card.className = 'modal-card';
  card.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:12px">
    <div style="font-weight:800">${glp}</div>
    <div id="modal-qr"></div>
    <div style="display:flex;gap:8px">
      <button id="close-modal" class="btn btn-ghost">CLOSE</button>
    </div>
  </div>`;
  backdrop.appendChild(card);
  document.body.appendChild(backdrop);
  generateQRCodeInto(glp, card.querySelector('#modal-qr'));
  card.querySelector('#close-modal').addEventListener('click', () => backdrop.remove());
  backdrop.addEventListener('click', (e)=>{ if(e.target === backdrop) backdrop.remove(); });
}

/* escape id helper */
function escapeId(s){ return s.replace(/[^a-z0-9_\-]/ig, '_'); }

/* Generate QR canvas into a container element (used widely) */
function generateQRCodeInto(text, container){ /* duplicated to include again for closure safety */ 
  container.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.width = 480; canvas.height = 480;
  new QRious({ element: canvas, value: text, size: 480, level: 'H' });
  const img = document.createElement('img');
  img.src = canvas.toDataURL('image/png');
  img.style.width = container.style.width || '120px';
  img.style.height = container.style.height || '120px';
  img.alt = 'QR ' + text;
  container.appendChild(img);
}

/* Expose refresh and scan out for other modules */
window.refreshInventory = refreshInventory;
window.confirmScanOut = confirmScanOut;
window.renderScanOut = renderScanOut;

/* final: ensure camera stops if navigating away */
window.addEventListener('visibilitychange', () => { if(document.hidden) stopQrCamera(); });
window.addEventListener('beforeunload', () => { stopQrCamera(); });

/* ensure initial inventory rendered when page loaded */
document.addEventListener('DOMContentLoaded', () => { if(document.querySelector('.tab')) refreshInventory(); });
