// ================================
// LPG HUB SYSTEM - FIXED APP JS
// ================================

let currentScanOutCylinder = null;

// -------------------------------
// NAVIGATION (FIXED)
// -------------------------------
function showScreen(screenName) {
    const screens = document.querySelectorAll('.screen');
    const buttons = document.querySelectorAll('.nav-btn');

    screens.forEach(s => s.classList.remove('active'));
    buttons.forEach(b => b.classList.remove('active'));

    const targetScreen = document.getElementById(`screen-${screenName}`);
    const targetBtn = document.getElementById(`nav-${screenName}`);

    if (targetScreen) targetScreen.classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');

    // Auto focus inputs
    setTimeout(() => {
        if (screenName === 'scan-in') {
            document.getElementById('scan-in-code')?.focus();
        }
        if (screenName === 'scan-out') {
            document.getElementById('scan-out-code')?.focus();
        }
        if (screenName === 'inventory') {
            refreshInventory();
        }
    }, 200);
}

// -------------------------------
// MESSAGE SYSTEM
// -------------------------------
function showMessage(id, msg, type = 'info') {
    const el = document.getElementById(id);
    if (!el) return;

    el.textContent = msg;
    el.className = `message show ${type}`;

    setTimeout(() => {
        el.classList.remove('show');
    }, 4000);
}

// ===============================
// SCAN IN (WORKING)
// ===============================
function handleScanIn() {
    const code = document.getElementById('scan-in-code').value.trim();
    const brand = document.getElementById('scan-in-brand').value;
    const weight = document.getElementById('scan-in-weight').value;
    const status = document.getElementById('scan-in-status').value;

    // STRICT VALIDATION (GLP ONLY RULE)
    if (!code.startsWith('GLP')) {
        return showMessage('scan-in-message', 'Only GLP cylinders allowed!', 'error');
    }

    if (!code || !brand || !weight || !status) {
        return showMessage('scan-in-message', 'Fill all fields', 'error');
    }

    const result = db.addCylinder(code, brand, weight, status);

    if (result.success) {
        showMessage('scan-in-message', result.message, 'success');

        document.getElementById('scan-in-code').value = '';
        document.getElementById('scan-in-weight').value = '';
        document.getElementById('scan-in-brand').value = '';
        document.getElementById('scan-in-status').value = '';

        updateInventoryStats();
    } else {
        showMessage('scan-in-message', result.message, 'error');
    }
}

// ===============================
// SCAN OUT (FIXED)
// ===============================
function handleScanOutSearch() {
    const code = document.getElementById('scan-out-code').value.trim();

    if (!code) {
        return showMessage('scan-out-message', 'Enter GLP code', 'error');
    }

    const result = db.findCylinder(code);

    if (!result.success) {
        return showMessage('scan-out-message', 'Cylinder not found', 'error');
    }

    currentScanOutCylinder = result.cylinder;

    document.getElementById('scan-out-glp').textContent = result.cylinder.glp_code;
    document.getElementById('scan-out-brand').textContent = result.cylinder.brand;
    document.getElementById('scan-out-weight').textContent = result.cylinder.weight;
    document.getElementById('scan-out-status').textContent = result.cylinder.status;

    document.getElementById('scan-out-details').classList.remove('hidden');

    showMessage('scan-out-message', 'Cylinder loaded', 'info');
}

function handleConfirmScanOut() {
    if (!currentScanOutCylinder) {
        return showMessage('scan-out-message', 'No cylinder selected', 'error');
    }

    const result = db.removeCylinder(currentScanOutCylinder.glp_code);

    if (result.success) {
        showMessage('scan-out-message', 'Cylinder removed successfully', 'success');

        resetScanOut();
        updateInventoryStats();
        displayInventory();
    } else {
        showMessage('scan-out-message', result.message, 'error');
    }
}

function resetScanOut() {
    document.getElementById('scan-out-code').value = '';
    document.getElementById('scan-out-details').classList.add('hidden');
    currentScanOutCylinder = null;
}

// ===============================
// INVENTORY (FIXED)
// ===============================
function displayInventory() {
    const list = document.getElementById('inventory-list');
    const data = db.getAll();

    list.innerHTML = '';

    if (!data.length) {
        list.innerHTML = `<p style="text-align:center;">No cylinders found</p>`;
        return;
    }

    data.forEach(c => {
        const div = document.createElement('div');
        div.className = 'cylinder-card';

        div.innerHTML = `
            <div><b>${c.glp_code}</b></div>
            <div>Brand: ${c.brand}</div>
            <div>Weight: ${c.weight}</div>
            <div>Status: ${c.status}</div>
        `;

        list.appendChild(div);
    });
}

function refreshInventory() {
    updateInventoryStats();
    displayInventory();
}

// ===============================
// STATS
// ===============================
function updateInventoryStats() {
    const stats = db.getStats();

    document.getElementById('stat-total').textContent = stats.total || 0;
    document.getElementById('stat-full').textContent = stats.full || 0;
    document.getElementById('stat-empty').textContent = stats.empty || 0;
    document.getElementById('stat-out').textContent = stats.out || 0;
}

// ===============================
// INIT (IMPORTANT FIX)
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    showScreen('scan-in');
    updateInventoryStats();
});
