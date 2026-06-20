name=js/app.js
// DATABASE
class DB {
    constructor() {
        this.key = 'lpg_cyl';
        this.load();
    }
    load() {
        try {
            this.data = JSON.parse(localStorage.getItem(this.key)) || [];
        } catch {
            this.data = [];
        }
    }
    save() {
        localStorage.setItem(this.key, JSON.stringify(this.data));
    }
    add(glp, brand, weight, status) {
        glp = glp.trim().toUpperCase();
        if (this.data.find(c => c.glp === glp && c.state === 'IN')) {
            throw new Error(`Cylinder ${glp} already exists`);
        }
        weight = parseFloat(weight);
        if (status === 'Full' && (weight < 24 || weight > 25)) {
            throw new Error('Full: 24.0-25.0 kg only');
        }
        if (status === 'Empty' && (weight < 11 || weight > 25)) {
            throw new Error('Empty: 11.0-25.0 kg only');
        }
        const cyl = {
            id: Date.now(),
            glp,
            brand,
            weight,
            status,
            state: 'IN',
            createdAt: new Date().toISOString()
        };
        this.data.push(cyl);
        this.save();
        return cyl;
    }
    find(glp) {
        return this.data.find(c => c.glp === glp.toUpperCase() && c.state === 'IN');
    }
    scanOut(id) {
        const cyl = this.data.find(c => c.id === id);
        if (cyl) {
            cyl.state = 'OUT';
            this.save();
        }
        return cyl;
    }
    getInStock() {
        return this.data.filter(c => c.state === 'IN');
    }
    getFull() {
        return this.data.filter(c => c.state === 'IN' && c.status === 'Full');
    }
    getEmpty() {
        return this.data.filter(c => c.state === 'IN' && c.status === 'Empty');
    }
    getOut() {
        return this.data.filter(c => c.state === 'OUT');
    }
}

const db = new DB();
let selectedCyl = null;

// SCREEN SWITCHING
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    document.querySelectorAll('.nav-button').forEach(b => b.classList.remove('active'));
    if (screenId === 'screenScanIn') document.getElementById('btnScanIn').classList.add('active');
    if (screenId === 'screenScanOut') document.getElementById('btnScanOut').classList.add('active');
    if (screenId === 'screenInventory') {
        document.getElementById('btnInventory').classList.add('active');
        updateStats();
        showTab('all');
    }
}

// NAV BUTTONS
document.getElementById('btnScanIn').addEventListener('click', () => showScreen('screenScanIn'));
document.getElementById('btnScanOut').addEventListener('click', () => showScreen('screenScanOut'));
document.getElementById('btnInventory').addEventListener('click', () => showScreen('screenInventory'));

// SCAN IN
document.getElementById('formScanIn').addEventListener('submit', (e) => {
    e.preventDefault();
    const glp = document.getElementById('glpCode').value;
    const brand = document.getElementById('brand').value;
    const weight = document.getElementById('weight').value;
    const status = document.getElementById('status').value;
    const msg = document.getElementById('msgScanIn');
    
    try {
        const cyl = db.add(glp, brand, weight, status);
        msg.className = 'message success';
        msg.textContent = `✓ Cylinder ${cyl.glp} registered!`;
        
        const canvas = document.getElementById('qrCanvasScanIn');
        QRCode.toCanvas(canvas, cyl.glp, {errorCorrectionLevel: 'H', width: 200, margin: 1});
        document.getElementById('qrTextScanIn').textContent = `GLP: ${cyl.glp}`;
        document.getElementById('qrScanIn').style.display = 'block';
        
        document.getElementById('formScanIn').reset();
        setTimeout(() => msg.className = '', 5000);
    } catch (err) {
        msg.className = 'message error';
        msg.textContent = `✗ ${err.message}`;
        document.getElementById('qrScanIn').style.display = 'none';
    }
});

// SCAN OUT
document.getElementById('formScanOut').addEventListener('submit', (e) => {
    e.preventDefault();
    const glp = document.getElementById('glpCodeOut').value;
    const msg = document.getElementById('msgScanOut');
    const info = document.getElementById('cylinderInfo');
    
    info.style.display = 'none';
    
    try {
        const cyl = db.find(glp);
        if (!cyl) throw new Error('Cylinder not found');
        
        selectedCyl = cyl;
        document.getElementById('infGlp').textContent = cyl.glp;
        document.getElementById('infBrand').textContent = cyl.brand;
        document.getElementById('infWeight').textContent = `${cyl.weight} kg`;
        document.getElementById('infStatus').textContent = cyl.status;
        
        const badge = document.getElementById('statusBadge');
        badge.className = `badge ${cyl.status.toLowerCase()}`;
        badge.textContent = cyl.status;
        
        const canvas = document.getElementById('qrCanvasScanOut');
        QRCode.toCanvas(canvas, cyl.glp, {errorCorrectionLevel: 'H', width: 150, margin: 1});
        
        info.style.display = 'block';
        msg.className = 'message success';
        msg.textContent = '✓ Cylinder found!';
    } catch (err) {
        msg.className = 'message error';
        msg.textContent = `✗ ${err.message}`;
    }
});

document.getElementById('btnConfirmOut').addEventListener('click', () => {
    if (!selectedCyl) return;
    const msg = document.getElementById('msgScanOut');
    
    try {
        db.scanOut(selectedCyl.id);
        msg.className = 'message success';
        msg.textContent = `✓ Cylinder ${selectedCyl.glp} scanned out!`;
        document.getElementById('cylinderInfo').style.display = 'none';
        document.getElementById('formScanOut').reset();
        selectedCyl = null;
        setTimeout(() => msg.className = '', 5000);
    } catch (err) {
        msg.className = 'message error';
        msg.textContent = `✗ ${err.message}`;
    }
});

// INVENTORY
function updateStats() {
    document.getElementById('statTotal').textContent = db.getInStock().length;
    document.getElementById('statFull').textContent = db.getFull().length;
    document.getElementById('statEmpty').textContent = db.getEmpty().length;
    document.getElementById('statOut').textContent = db.getOut().length;
}

function showTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (tab === 'all') document.getElementById('tabAll').classList.add('active');
    if (tab === 'full') document.getElementById('tabFull').classList.add('active');
    if (tab === 'empty') document.getElementById('tabEmpty').classList.add('active');
    
    let cyls = [];
    if (tab === 'all') cyls = db.getInStock();
    if (tab === 'full') cyls = db.getFull();
    if (tab === 'empty') cyls = db.getEmpty();
    
    const list = document.getElementById('cylindersList');
    if (cyls.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No cylinders</p></div>';
        return;
    }
    
    list.innerHTML = cyls.map(c => `
        <div class="cylinder-card">
            <div class="card-header">
                <div class="card-glp">${c.glp}</div>
                <span class="card-status status-${c.status.toLowerCase()}">${c.status}</span>
            </div>
            <div class="card-details">
                <div class="detail"><span class="key">Brand:</span><span>${c.brand}</span></div>
                <div class="detail"><span class="key">Weight:</span><span>${c.weight} kg</span></div>
                <div class="detail"><span class="key">Date:</span><span>${new Date(c.createdAt).toLocaleDateString()}</span></div>
            </div>
            <div class="card-qr" id="qr-${c.id}"></div>
            <button class="card-button" onclick="quickOut(${c.id})">Scan Out</button>
        </div>
    `).join('');
    
    cyls.forEach(c => {
        const canvas = document.createElement('canvas');
        QRCode.toCanvas(canvas, c.glp, {errorCorrectionLevel: 'H', width: 150, margin: 1});
        document.getElementById(`qr-${c.id}`).appendChild(canvas);
    });
}

function quickOut(id) {
    const cyl = db.data.find(c => c.id === id);
    if (cyl) {
        document.getElementById('glpCodeOut').value = cyl.glp;
        showScreen('screenScanOut');
        setTimeout(() => document.getElementById('formScanOut').dispatchEvent(new Event('submit')), 100);
    }
}

document.getElementById('tabAll').addEventListener('click', () => showTab('all'));
document.getElementById('tabFull').addEventListener('click', () => showTab('full'));
document.getElementById('tabEmpty').addEventListener('click', () => showTab('empty'));

// INIT
showScreen('screenScanIn');
