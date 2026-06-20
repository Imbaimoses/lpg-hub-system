// LPG Cylinder Inventory App v3 (single-file front-end logic)

// Storage key
const STORAGE_KEY = 'cylinders_v3';

// Allowed options
const BRANDS = ['PayGo','Wajiko','GreenWells'];
const STATUSES = ['Full','Empty'];

// UI refs
const main = document.getElementById('main');
const btnIn = document.getElementById('btn-in');
const btnOut = document.getElementById('btn-out');
const btnInv = document.getElementById('btn-inv');

const modalIn = document.getElementById('modal-in');
const modalOut = document.getElementById('modal-out');
const qrModal = document.getElementById('qr-modal');

let html5QrScanner = null;

// init
btnIn.addEventListener('click', openScanIn);
btnOut.addEventListener('click', openScanOut);
btnInv.addEventListener('click', renderInventory);

// show inventory initially
renderInventory();
updateStats();

// ---------------- Storage ----------------
function loadCylinders(){ try{ const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : []; } catch(e){ return []; } }
function saveCylinders(arr){ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }

// ---------------- Scan IN ----------------
function openScanIn(){
  // show modal
  modalIn.classList.remove('hidden');
  // reset fields
  document.getElementById('in-glp').value = '';
  document.getElementById('in-weight').value = '';
  document.getElementById('in-status').value = 'Full';
  document.getElementById('in-brand').value = 'PayGo';
  hideErr('in-glp-err'); hideErr('in-weight-err');

  document.getElementById('in-cancel').onclick = () => modalIn.classList.add('hidden');
  document.getElementById('in-register').onclick = registerCylinder;
}

function hideErr(id){ const e = document.getElementById(id); if(e){ e.style.display='none'; e.textContent=''; } }
function showErr(id, msg){ const e = document.getElementById(id); if(e){ e.style.display='block'; e.textContent = msg; } }

function registerCylinder(){
  const glp = (document.getElementById('in-glp').value || '').trim().toUpperCase();
  const status = document.getElementById('in-status').value;
  const brand = document.getElementById('in-brand').value;
  const weightRaw = document.getElementById('in-weight').value;
  const weight = weightRaw === '' ? null : Number(weightRaw);

  hideErr('in-glp-err'); hideErr('in-weight-err');

  // validations
  if(!glp){ showErr('in-glp-err','GLP Code is required.'); return; }
  if(!/^GLP[0-9A-Z]*$/i.test(glp)){ showErr('in-glp-err','GLP must start with "GLP" and be alphanumeric.'); return; }
  if(!BRANDS.includes(brand)){ alert('Invalid brand'); return; }
  if(!STATUSES.includes(status)){ alert('Invalid status'); return; }
  if(weight === null || Number.isNaN(weight)){ showErr('in-weight-err','Weight required.'); return; }

  // ranges
  if(status === 'Full'){
    if(!(weight >= 24.0 && weight <= 25.0)){ showErr('in-weight-err','Full weight must be between 24.0 and 25.0 kg (inclusive).'); return; }
  } else {
    if(!(weight >= 11.0 && weight <= 25.0)){ showErr('in-weight-err','Empty weight must be between 11.0 and 25.0 kg (inclusive).'); return; }
  }

  // uniqueness among active IN cylinders
  const arr = loadCylinders();
  if(arr.some(c => c.glp.toUpperCase() === glp && c.state === 'IN')){ showErr('in-glp-err','This GLP already exists in active inventory.'); return; }

  const newC = { glp: glp.toUpperCase(), brand, weight: Number(weight.toFixed(1)), status, state: 'IN', createdAt: new Date().toISOString() };
  arr.push(newC);
  saveCylinders(arr);

  modalIn.classList.add('hidden');
  renderInventory();
  updateStats();
  alert('Cylinder registered and QR generated.');
}

// ---------------- Inventory ----------------
function renderInventory(){
  // set active nav style
  btnInv.classList.add('active');
  btnIn.classList.remove('active');
  btnOut.classList.remove('active');

  const arr = loadCylinders();
  const active = arr.filter(c => c.state === 'IN');

  main.innerHTML = `
    <div class="inventory">
      <div class="controls">
        <div>
          <div class="tabs">
            <button class="tab active" data-tab="all">All</button>
            <button class="tab" data-tab="full">Full</button>
            <button class="tab" data-tab="empty">Empty</button>
          </div>
          <div id="brand-subtabs" class="subtabs" style="margin-top:8px;display:none">
            <button class="subtab active" data-brand="all">All Brands</button>
            <button class="subtab" data-brand="PayGo">PayGo</button>
            <button class="subtab" data-brand="Wajiko">Wajiko</button>
            <button class="subtab" data-brand="GreenWells">GreenWells</button>
          </div>
        </div>
        <div class="controls-right">
          <input id="search" class="search" placeholder="Search GLP or Brand" />
          <button id="open-in" class="btn primary">Scan IN</button>
        </div>
      </div>

      <div id="cards" class="cards"></div>
    </div>
  `;

  // events
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', (e) => {
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    e.currentTarget.classList.add('active');
    // show subtabs only when full/empty
    const tab = e.currentTarget.dataset.tab;
    document.getElementById('brand-subtabs').style.display = (tab === 'full' || tab === 'empty') ? 'flex' : 'none';
    document.querySelectorAll('.subtab').forEach(x=>x.classList.remove('active'));
    document.querySelector('.subtab[data-brand="all"]').classList.add('active');
    renderCards();
  }));
  document.querySelectorAll('.subtab').forEach(s => s.addEventListener('click', (e) => {
    document.querySelectorAll('.subtab').forEach(x=>x.classList.remove('active'));
    e.currentTarget.classList.add('active');
    renderCards();
  }));
  document.getElementById('open-in').addEventListener('click', openScanIn);
  document.getElementById('search').addEventListener('input', renderCards);

  renderCards();

  function renderCards(){
    const tab = document.querySelector('.tab.active').dataset.tab;
    const brand = (() => {
      const sb = document.querySelector('.subtab.active'); return sb ? sb.dataset.brand : 'all';
    })();
    const q = (document.getElementById('search').value || '').trim().toUpperCase();

    let filtered = active.slice();
    if(tab === 'full') filtered = filtered.filter(c => c.status === 'Full');
    if(tab === 'empty') filtered = filtered.filter(c => c.status === 'Empty');
    if(brand && brand !== 'all') filtered = filtered.filter(c => c.brand === brand);
    if(q) filtered = filtered.filter(c => c.glp.toUpperCase().includes(q) || c.brand.toUpperCase().includes(q));

    const cards = document.getElementById('cards');
    cards.innerHTML = '';
    if(filtered.length === 0){ cards.innerHTML = '<div class="small muted">No cylinders to show.</div>'; return; }
    filtered.forEach(c => {
      const card = document.createElement('div'); card.className = 'card';
      card.innerHTML = `
        <div>
          <div class="glp">${c.glp}</div>
          <div class="meta">${c.brand} • ${c.weight.toFixed(1)} kg • ${c.status}</div>
          <div class="small muted">Added: ${new Date(c.createdAt).toLocaleString()}</div>
        </div>
        <div style="display:flex;gap:12px;align-items:center;justify-content:space-between;">
          <div class="qr" id="qr-${escapeId(c.glp)}"></div>
          <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
            <button class="btn primary scan-out-from-card" data-glp="${c.glp}">Scan OUT</button>
            <button class="btn" data-glp="${c.glp}" data-action="enlarge">Enlarge QR</button>
          </div>
        </div>
      `;
      cards.appendChild(card);
      generateQRCodeInto(c.glp, card.querySelector(`#qr-${escapeId(c.glp)}`));

      card.querySelector('.scan-out-from-card').addEventListener('click', (e) => {
        openScanOutForGLP(e.currentTarget.dataset.glp);
      });
      card.querySelector('button[data-action="enlarge"]').addEventListener('click', () => {
        showQrModal(c.glp);
      });
    });
  }
}

// ---------------- Scan OUT ----------------
function openScanOut(){
  modalOut.classList.remove('hidden');
  document.getElementById('out-mode-scan').onclick = startOutScanMode;
  document.getElementById('out-mode-type').onclick = startOutTypeMode;
  document.getElementById('out-scan-stop').onclick = stopOutScan;
  document.getElementById('out-scan-cancel').onclick = () => closeOutModal();
  document.getElementById('out-type-cancel').onclick = () => closeOutModal();
  document.getElementById('out-type-search').onclick = () => {
    const glp = (document.getElementById('out-glp').value || '').trim().toUpperCase();
    findOutByGlpTyped(glp);
  };
  // default: show options only
  hideAllOutAreas();
}

function hideAllOutAreas(){
  document.getElementById('out-scan-area').classList.add('hidden');
  document.getElementById('out-type-area').classList.add('hidden');
  document.getElementById('out-result').innerHTML = '';
}

function startOutScanMode(){
  hideAllOutAreas();
  document.getElementById('out-scan-area').classList.remove('hidden');
  startQrCamera((decoded) => {
    const val = decoded.trim().toUpperCase();
    if(!val.startsWith('GLP')){ alert('Scanned code is not a cylinder (must start with GLP).'); return; }
    stopOutScan();
    showOutResultForGlp(val);
  });
}

function startOutTypeMode(){
  hideAllOutAreas();
  document.getElementById('out-type-area').classList.remove('hidden');
  document.getElementById('out-glp').value = '';
  document.getElementById('out-glp-err').style.display = 'none';
}

function stopOutScan(){
  stopQrCamera();
  document.getElementById('out-scan-info').textContent = 'Scanner stopped.';
}

function closeOutModal(){
  stopQrCamera();
  modalOut.classList.add('hidden');
  hideAllOutAreas();
}

// direct open scan out for a known GLP (from card)
function openScanOutForGLP(glp){
  modalOut.classList.remove('hidden');
  hideAllOutAreas();
  showOutResultForGlp(glp);
}

// find using typed GLP
function findOutByGlpTyped(glp){
  if(!glp){ showErr('out-glp-err','Enter GLP code.'); return; }
  if(!/^GLP[0-9A-Z]*$/i.test(glp)){ showErr('out-glp-err','GLP must start with "GLP".'); return; }
  hideErr('out-glp-err');
  showOutResultForGlp(glp.toUpperCase());
}

// show out result and confirm button
function showOutResultForGlp(glp){
  const arr = loadCylinders();
  const found = arr.find(c => c.glp.toUpperCase() === glp.toUpperCase() && c.state === 'IN');
  const root = document.getElementById('out-result');
  root.innerHTML = '';
  if(!found){ root.innerHTML = `<div class="small muted">Cylinder ${glp} not found in active inventory.</div>`; return; }

  const div = document.createElement('div');
  div.className = 'panel';
  div.innerHTML = `
    <div style="display:flex;gap:12px;align-items:center">
      <div class="qr" id="out-qr-${escapeId(found.glp)}" style="width:160px;height:160px"></div>
      <div>
        <div style="font-weight:800">${found.glp}</div>
        <div class="meta">${found.brand} • ${found.weight.toFixed(1)} kg • ${found.status}</div>
        <div class="small muted">Added: ${new Date(found.createdAt).toLocaleString()}</div>
        <div style="margin-top:10px" class="row">
          <button id="confirm-out" class="btn primary">CONFIRM SCAN OUT</button>
          <button id="cancel-out" class="btn">CANCEL</button>
        </div>
      </div>
    </div>
  `;
  root.appendChild(div);
  generateQRCodeInto(found.glp, div.querySelector(`#out-qr-${escapeId(found.glp)}`));
  document.getElementById('cancel-out').onclick = () => closeOutModal();
  document.getElementById('confirm-out').onclick = () => {
    const idx = arr.findIndex(c => c.glp.toUpperCase() === found.glp.toUpperCase() && c.state === 'IN');
    if(idx === -1){ alert('Cylinder not available.'); renderInventory(); closeOutModal(); return; }
    arr[idx].state = 'OUT';
    saveCylinders(arr);
    alert('Cylinder marked OUT.');
    updateStats();
    renderInventory();
    closeOutModal();
  };
}

// ---------------- QR generation & scanning helpers ----------------
function generateQRCodeInto(text, container){
  container.innerHTML = '';
  // render high-res canvas and convert to img for crispness
  const canvas = document.createElement('canvas');
  canvas.width = 640; canvas.height = 640;
  new QRious({ element: canvas, value: text, size: 640, level: 'H' });
  const img = document.createElement('img');
  img.src = canvas.toDataURL('image/png');
  img.style.width = container.style.width || '120px';
  img.style.height = container.style.height || '120px';
  img.alt = 'QR ' + text;
  container.appendChild(img);
}

function startQrCamera(onDetected){
  const qrReaderDiv = document.getElementById('qr-reader');
  if(!qrReaderDiv) return;
  qrReaderDiv.innerHTML = '<div class="small muted">Starting camera…</div>';
  Html5Qrcode.getCameras().then(cams => {
    if(!cams || cams.length === 0){ qrReaderDiv.innerHTML = '<div class="small muted">No camera found.</div>'; return; }
    const cam = cams.find(c => /back|rear|environment/i.test(c.label)) || cams[0];
    html5QrScanner = new Html5Qrcode("qr-reader");
    html5QrScanner.start(cam.id, { fps: 8, qrbox: 250 },
      qrMsg => { onDetected(qrMsg); },
      err => { /* scanning... */ }
    ).catch(err => { qrReaderDiv.innerHTML = `<div class="small muted">Camera start failed: ${err}</div>`; });
  }).catch(err => { qrReaderDiv.innerHTML = `<div class="small muted">Camera error: ${err}</div>`; });
}

function stopQrCamera(){
  if(html5QrScanner){
    html5QrScanner.stop().then(() => { html5QrScanner.clear(); html5QrScanner = null; }).catch(()=>{ html5QrScanner = null; });
  }
}

// ---------------- QR modal ----------------
function showQrModal(glp){
  qrModal.classList.remove('hidden');
  const cont = document.getElementById('qr-modal-content');
  cont.innerHTML = `<div style="text-align:center"><div style="font-weight:800;margin-bottom:8px">${glp}</div><div id="qr-modal-img"></div></div>`;
  generateQRCodeInto(glp, document.getElementById('qr-modal-img'));
  document.getElementById('qr-modal-close').onclick = () => qrModal.classList.add('hidden');
}

// ---------------- Helpers ----------------
function escapeId(s){ return s.replace(/[^a-z0-9_\-]/ig, '_'); }

function updateStats(){
  const arr = loadCylinders();
  const inCount = arr.filter(c => c.state === 'IN').length;
  const fullCount = arr.filter(c => c.state === 'IN' && c.status === 'Full').length;
  const emptyCount = arr.filter(c => c.state === 'IN' && c.status === 'Empty').length;
  const outCount = arr.filter(c => c.state === 'OUT').length;
  const stats = document.getElementById('stats');
  stats.innerHTML = `<div class="stat"><div class="num">${inCount}</div><div class="small">Total In Stock</div></div>
                     <div class="stat"><div class="num">${fullCount}</div><div class="small">Full</div></div>
                     <div class="stat"><div class="num">${emptyCount}</div><div class="small">Empty</div></div>
                     <div class="stat"><div class="num">${outCount}</div><div class="small">Scanned Out</div></div>`;
}

// ---------------- utility to generate QR into elements used earlier ----------------
// exported as global for reuse in various closures
window.generateQRCodeInto = generateQRCodeInto;

// Stop camera when page hidden/unloaded
window.addEventListener('beforeunload', () => stopQrCamera());
window.addEventListener('visibilitychange', () => { if(document.hidden) stopQrCamera(); });
