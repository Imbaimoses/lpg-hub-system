// LPG Cylinder Inventory App (localStorage)
// Key features implemented: Scan IN, Scan OUT, Inventory (3 tabs), QR generation, QR scanning, validations.

const STORAGE_KEY = 'cylinders';

// Allowed brands and statuses
const BRANDS = ['PayGo', 'Wajiko', 'GreenWells'];
const STATUSES = ['Full', 'Empty'];

// DOM refs
const content = document.getElementById('content');
document.getElementById('btn-scan-in').addEventListener('click', showScanIn);
document.getElementById('btn-scan-out').addEventListener('click', showScanOut);
document.getElementById('btn-inventory').addEventListener('click', showInventory);

// App init
renderHome();

function loadCylinders(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}
function saveCylinders(arr){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

// Home (default) - show brief actions (redirect to Inventory by default)
function renderHome(){
  showInventory();
}

// --- SCAN IN ---
function showScanIn(){
  content.innerHTML = '';
  const panel = createPanel();

  const form = document.createElement('div');
  form.className = 'panel';
  form.innerHTML = `
    <h3>Scan IN — Register Cylinder</h3>
    <div class="form-row">
      <label>GLP Code</label>
      <input id="in-glp" type="text" placeholder="GLPKEH06779F" />
    </div>
    <div class="form-row">
      <label>Brand</label>
      <select id="in-brand"></select>
    </div>
    <div class="form-row">
      <label>Status</label>
      <select id="in-status"></select>
    </div>
    <div class="form-row">
      <label>Weight (kg)</label>
      <input id="in-weight" type="number" step="0.1" />
    </div>
    <div class="small" id="in-help">All fields required. Duplicate active GLP codes are not allowed.</div>
    <div class="actions">
      <button id="register-btn" class="btn btn-primary">REGISTER CYLINDER</button>
      <button id="in-cancel" class="btn btn-secondary">CANCEL</button>
    </div>
  `;
  panel.appendChild(form);
  content.appendChild(panel);

  // populate selects
  const brandSelect = document.getElementById('in-brand');
  BRANDS.forEach(b => {
    const op = document.createElement('option'); op.value = b; op.textContent = b; brandSelect.appendChild(op);
  });
  const statusSelect = document.getElementById('in-status');
  STATUSES.forEach(s => {
    const op = document.createElement('option'); op.value = s; op.textContent = s; statusSelect.appendChild(op);
  });

  document.getElementById('in-cancel').addEventListener('click', showInventory);
  document.getElementById('register-btn').addEventListener('click', () => {
    const glp = (document.getElementById('in-glp').value || '').trim();
    const brand = brandSelect.value;
    const status = statusSelect.value;
    const weightRaw = document.getElementById('in-weight').value;
    const weight = weightRaw === '' ? null : Number(weightRaw);

    const err = validateScanIn(glp, brand, status, weight);
    if(err){
      alert(err);
      return;
    }
    // Save
    const cylinders = loadCylinders();
    const existsActive = cylinders.some(c => c.glp.toUpperCase() === glp.toUpperCase() && c.state === 'IN');
    if(existsActive){
      alert('A cylinder with this GLP is already active (state = IN). Duplicate active cylinders are not allowed.');
      return;
    }
    const cyl = {
      glp: glp.toUpperCase(),
      brand,
      weight,
      status,
      state: 'IN',
      createdAt: new Date().toISOString()
    };
    cylinders.push(cyl);
    saveCylinders(cylinders);
    alert('Cylinder registered.');
    showInventory();
  });
}

function validateScanIn(glp, brand, status, weight){
  if(!glp) return 'GLP Code is required.';
  // Basic GLP format - allow letters/digits and length between 6 and 20
  if(!/^[A-Za-z0-9]+$/.test(glp)) return 'GLP Code must be letters and digits only (no spaces).';
  if(!(BRANDS.includes(brand))) return 'Brand is invalid.';
  if(!(STATUSES.includes(status))) return 'Status is invalid.';
  if(weight === null || Number.isNaN(weight)) return 'Weight is required.';
  // Round to one decimal place check allowed values using inclusive ranges
  const w = Number(weight);
  if(status === 'Full'){
    if(!(w >= 24.0 && w <= 25.0)) return 'For Full status weight must be between 24.0 kg and 25.0 kg (inclusive).';
  } else { // Empty
    if(!(w >= 11.0 && w <= 25.0)) return 'For Empty status weight must be between 11.0 kg and 25.0 kg (inclusive).';
  }
  return null;
}

// --- INVENTORY ---
function showInventory(){
  content.innerHTML = '';
  const panel = createPanel();
  panel.innerHTML = `
    <div class="inventory-top">
      <div>
        <h3>Inventory</h3>
        <div class="small">Only cylinders with state = IN appear here.</div>
      </div>
      <div class="counters" id="counters"></div>
    </div>

    <div class="tabs" id="tabs"></div>
    <div class="cards" id="cards"></div>
  `;
  content.appendChild(panel);

  // tabs
  const tabs = document.getElementById('tabs');
  const tabNames = [
    {id:'all', label:'All Cylinders'},
    {id:'full', label:'Full Cylinders'},
    {id:'empty', label:'Empty Cylinders'}
  ];
  tabNames.forEach((t, idx) => {
    const el = document.createElement('div');
    el.className = 'tab' + (idx===0 ? ' active' : '');
    el.dataset.tab = t.id;
    el.textContent = t.label;
    el.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      el.classList.add('active');
      renderInventoryCards(t.id);
    });
    tabs.appendChild(el);
  });

  renderCounters();
  renderInventoryCards('all');
}

function renderCounters(){
  const counts = {
    totalIn: 0,
    full: 0,
    empty: 0,
    scannedOut: 0
  };
  const cylinders = loadCylinders();
  cylinders.forEach(c => {
    if(c.state === 'IN'){
      counts.totalIn++;
      if(c.status === 'Full') counts.full++;
      if(c.status === 'Empty') counts.empty++;
    } else {
      counts.scannedOut++;
    }
  });
  const container = document.getElementById('counters');
  container.innerHTML = '';
  container.appendChild(counterEl('Total In Stock', counts.totalIn));
  container.appendChild(counterEl('Full Cylinders', counts.full));
  container.appendChild(counterEl('Empty Cylinders', counts.empty));
  container.appendChild(counterEl('Scanned Out', counts.scannedOut));
}

function counterEl(label, num){
  const d = document.createElement('div');
  d.className = 'counter';
  d.innerHTML = `<div style="font-weight:700;font-size:18px">${num}</div><div class="small">${label}</div>`;
  return d;
}

function renderInventoryCards(tab){
  const cards = document.getElementById('cards');
  cards.innerHTML = '';
  const cylinders = loadCylinders();
  const filtered = cylinders.filter(c => c.state === 'IN').filter(c => {
    if(tab === 'all') return true;
    if(tab === 'full') return c.status === 'Full';
    if(tab === 'empty') return c.status === 'Empty';
    return true;
  });
  if(filtered.length === 0){
    cards.innerHTML = `<div class="small">No cylinders to show in this tab.</div>`;
    return;
  }
  filtered.forEach(c => {
    cards.appendChild(createCard(c));
  });
}

function createCard(cyl){
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="glp">${cyl.glp}</div>
    <div class="meta">${cyl.brand} — ${cyl.weight.toFixed(1)} kg — ${cyl.status}</div>
    <div class="center">
      <div class="qr-img" id="qr-${escapeId(cyl.glp)}"></div>
    </div>
    <div class="card-footer">
      <div class="small">Registered: ${new Date(cyl.createdAt).toLocaleString()}</div>
      <div>
        <button class="btn btn-danger btn-scan-out" data-glp="${cyl.glp}">SCAN OUT</button>
      </div>
    </div>
  `;
  // generate QR
  generateQRCodeInto(cyl.glp, document.getElementById(`qr-${escapeId(cyl.glp)}`));
  // attach scan out handler
  card.querySelector('.btn-scan-out').addEventListener('click', () => openConfirmScanOut(cyl.glp));
  return card;
}

function escapeId(s){ return s.replace(/[^a-z0-9_\-]/ig, '_'); }

function generateQRCodeInto(text, container){
  container.innerHTML = '';
  // using Qrious to produce canvas image
  const canvas = document.createElement('canvas');
  canvas.width = 240; canvas.height = 240; // larger for better scanning
  const qr = new QRious({
    element: canvas,
    value: text,
    size: 240,
    level: 'H'
  });
  // scale down for display but keep image resolution
  const img = document.createElement('img');
  img.src = canvas.toDataURL('image/png');
  img.style.width = '120px';
  img.style.height = '120px';
  container.appendChild(img);
}

// --- SCAN OUT ---
function showScanOut(){
  content.innerHTML = '';
  const panel = createPanel();
  panel.innerHTML = `
    <h3>Scan OUT — Remove Cylinder</h3>
    <div class="panel">
      <div class="form-row">
        <label>Scan QR</label>
        <div>
          <div id="qr-reader" style="width:320px"></div>
          <div class="small">Or: enter GLP code manually below.</div>
        </div>
      </div>

      <div class="form-row">
        <label>GLP Code</label>
        <input id="out-glp" type="text" placeholder="GLPKEH06779F" />
      </div>
      <div class="actions">
        <button id="out-search" class="btn btn-primary">SEARCH</button>
        <button id="out-cancel" class="btn btn-secondary">CANCEL</button>
      </div>

      <div id="out-result" class="scan-preview"></div>
    </div>
  `;
  content.appendChild(panel);

  document.getElementById('out-cancel').addEventListener('click', showInventory);
  document.getElementById('out-search').addEventListener('click', () => {
    const glp = (document.getElementById('out-glp').value || '').trim().toUpperCase();
    if(!glp){ alert('Enter GLP code or scan QR.'); return; }
    findAndShowOut(glp);
  });

  // start camera scanner
  startQrCameraScanner((decodedText) => {
    // when a QR is detected
    stopQrCameraScanner();
    findAndShowOut(decodedText.trim().toUpperCase());
  });
}

// scanner controller
let html5QrScanner = null;

function startQrCameraScanner(onDetected){
  const qrReaderDiv = document.getElementById('qr-reader');
  if(!qrReaderDiv) return;
  qrReaderDiv.innerHTML = ''; // reset
  const config = { fps: 10, qrbox: 250 };
  html5QrScanner = new Html5Qrcode(/* element id */ "qr-reader");
  Html5Qrcode.getCameras().then(cameras => {
    if(cameras && cameras.length){
      const cameraId = cameras[0].id;
      html5QrScanner.start(
        cameraId,
        config,
        qrCodeMessage => {
          onDetected(qrCodeMessage);
        },
        errorMessage => {
          // no-op for now
        }
      ).catch(err => {
        qrReaderDiv.innerHTML = `<div class="small">Camera start failed: ${err}. You can still enter GLP manually.</div>`;
      });
    } else {
      qrReaderDiv.innerHTML = `<div class="small">No camera found. Enter GLP manually.</div>`;
    }
  }).catch(err => {
    qrReaderDiv.innerHTML = `<div class="small">Camera error: ${err}. Enter GLP manually.</div>`;
  });
}

function stopQrCameraScanner(){
  if(html5QrScanner){
    html5QrScanner.stop().then(() => {
      html5QrScanner.clear();
      html5QrScanner = null;
      const div = document.getElementById('qr-reader');
      if(div) div.innerHTML = '';
    }).catch(()=>{ html5QrScanner = null; });
  }
}

function findAndShowOut(glp){
  const cylinders = loadCylinders();
  const found = cylinders.find(c => c.glp.toUpperCase() === glp.toUpperCase() && c.state === 'IN');
  const outResult = document.getElementById('out-result');
  outResult.innerHTML = '';
  if(!found){
    outResult.innerHTML = `<div class="small">Cylinder ${glp} not found in active inventory (state = IN).</div>`;
    return;
  }
  const div = document.createElement('div');
  div.className = 'panel';
  div.innerHTML = `
    <div style="font-weight:700;font-size:16px">${found.glp}</div>
    <div class="small">${found.brand} — ${found.weight.toFixed(1)} kg — ${found.status}</div>
    <div style="margin-top:8px" id="out-qr-${escapeId(found.glp)}"></div>
    <div style="margin-top:8px" class="actions">
      <button id="confirm-out" class="btn btn-danger">CONFIRM SCAN OUT</button>
      <button id="cancel-out" class="btn btn-secondary">CANCEL</button>
    </div>
  `;
  outResult.appendChild(div);
  generateQRCodeInto(found.glp, document.getElementById(`out-qr-${escapeId(found.glp)}`));
  document.getElementById('cancel-out').addEventListener('click', () => {
    stopQrCameraScanner();
    showInventory();
  });
  document.getElementById('confirm-out').addEventListener('click', () => {
    // mark as OUT
    const idx = cylinders.findIndex(c => c.glp.toUpperCase() === found.glp.toUpperCase() && c.state === 'IN');
    if(idx === -1){
      alert('Cylinder no longer available.');
      showInventory();
      return;
    }
    cylinders[idx].state = 'OUT';
    saveCylinders(cylinders);
    alert('Cylinder marked as OUT.');
    stopQrCameraScanner();
    showInventory();
  });
}

// Open confirm for card's scan out (from inventory)
function openConfirmScanOut(glp){
  // simple confirm dialog to avoid two screens
  if(!confirm(`Confirm Scan OUT for ${glp}?`)) return;
  // mark out
  const cylinders = loadCylinders();
  const idx = cylinders.findIndex(c => c.glp.toUpperCase() === glp.toUpperCase() && c.state === 'IN');
  if(idx === -1){
    alert('Cylinder not found or already OUT.');
    renderCounters();
    renderInventoryCards('all');
    return;
  }
  cylinders[idx].state = 'OUT';
  saveCylinders(cylinders);
  alert('Cylinder marked as OUT.');
  // refresh inventory view
  renderCounters();
  // refresh active tab
  const activeTab = document.querySelector('.tab.active').dataset.tab;
  renderInventoryCards(activeTab);
}

// Utility to create a simple panel container
function createPanel(){
  const p = document.createElement('div');
  p.className = 'panel';
  return p;
}

// Before unload: stop camera (safety)
window.addEventListener('beforeunload', () => {
  if(html5QrScanner) {
    try{ html5QrScanner.stop(); } catch(e){}
  }
});
