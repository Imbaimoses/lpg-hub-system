// ===============================
// LPG CYLINDER INVENTORY APP (FIXED)
// ===============================

let currentScanOutCylinder = null;

// -------------------------------
// SCREEN NAVIGATION
// -------------------------------
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    document.getElementById(`screen-${screenName}`).classList.add('active');
    document.getElementById(`nav-${screenName}`).classList.add('active');

    setTimeout(() => {
        if (screenName === 'scan-in') {
            document.getElementById('scan-in-code').focus();
        } else if (screenName === 'scan-out') {
            document.getElementById('scan-out-code').focus();
        }
    }, 100);
}

// -------------------------------
// MESSAGE HANDLER
// -------------------------------
function showMessage(id, message, type = 'info') {
    const el = document.getElementById(id);
    el.textContent = message;
    el.className = `message show ${type}`;

    setTimeout(() => el.classList.remove('show'), 4000);
}

// ===============================
// SCAN IN
// ===============================
function handleScanIn() {
    const code = document.getElementById('scan-in-code').value.trim();
    const brand = document.getElementById('scan-in-brand').value;
    const weight = document.getElementById('scan-in-weight').value;
    const status = document.getElementById('scan-in-status').value;

    if (!code || !code.startsWith("GLP")) {
        showMessage('scan-in-message', 'Code must start with GLP', 'error');
        return;
    }

    if (!brand || !weight || !status) {
        showMessage('scan-in-message', 'Fill all fields', 'error');
        return;
    }

    const result = db.addCylinder(code, brand, weight, status);

    if (result.success) {
        showMessage('scan-in-message', result.message, 'success');

        document.getElementById('scan-in-code').value = '';
        document.getElementById('scan-in-weight').value = '';
        document.getElementById('scan-in-brand').value = '';
        document.getElementById('scan-in-status').value = '';
    } else {
        showMessage('scan-in-message', result.message, 'error');
    }
}

// ===============================
// SCAN OUT
// ===============================
function handleScanOutSearch() {
    const code = document.getElementById('scan-out-code').value.trim();

    if (!code) {
        showMessage('scan-out-message', 'Enter GLP code', 'error');
        return;
    }

    const result = db.scanOutCylinder(code);

    if (result.success) {
        currentScanOutCylinder = result.cylinder;
        displayScanOutDetails(result.cylinder);
        showMessage('scan-out-message', 'Cylinder found', 'info');
    } else {
        showMessage('scan-out-message', result.message, 'error');
    }
}

function displayScanOutDetails(c) {
    document.getElementById('scan-out-glp').textContent = c.glp_code;
    document.getElementById('scan-out-brand').textContent = c.brand;
    document.getElementById('scan-out-weight').textContent = c.weight;
    document.getElementById('scan-out-status').textContent = c.status;
    document.getElementById('scan-out-details').classList.remove('hidden');
}

function handleConfirmScanOut() {
    if (!currentScanOutCylinder) return;

    const result = db.confirmScanOut(currentScanOutCylinder.glp_code);

    if (result.success) {
        showMessage('scan-out-message', 'Scanned OUT successfully', 'success');
        resetScanOut();
        displayInventory();
    }
}

function resetScanOut() {
    document.getElementById('scan-out-code').value = '';
    document.getElementById('scan-out-details').classList.add('hidden');
    currentScanOutCylinder = null;
}

// ===============================
// INVENTORY
// ===============================
function displayInventory() {
    const grouped = db.getGroupedInventory();
    const container = document.getElementById('inventory-list');

    container.innerHTML = '';

    const brands = ['PayGo', 'Wajiko', 'GreenWells'];

    brands.forEach(brand => {
        if (!grouped[brand]) return;

        const section = document.createElement('div');
        section.className = 'brand-section';

        section.innerHTML = `<h3>${brand}</h3>`;

        ['Full', 'Empty'].forEach(status => {
            if (!grouped[brand][status] || grouped[brand][status].length === 0) return;

            const group = document.createElement('div');
            group.innerHTML = `<h4>${status}</h4>`;

            grouped[brand][status].forEach(c => {
                const card = document.createElement('div');
                card.className = 'cylinder-card';

                card.innerHTML = `
                    <div class="cylinder-code">${c.glp_code}</div>
                    <div>Brand: ${c.brand}</div>
                    <div>Weight: ${c.weight} kg</div>
                    <div>Status: ${c.status}</div>
                    <canvas class="qr"></canvas>
                    <button onclick="scanOutFromInventory('${c.glp_code}')">
                        📤 Scan Out
                    </button>
                `;

                group.appendChild(card);

                // REAL QR GENERATION (FIX)
                const canvas = card.querySelector('.qr');

                QRCode.toCanvas(canvas, c.glp_code, {
                    width: 120,
                    margin: 1
                });
            });

            section.appendChild(group);
        });

        container.appendChild(section);
    });
}

// -------------------------------
// INVENTORY ACTION
// -------------------------------
function scanOutFromInventory(code) {
    showScreen('scan-out');
    document.getElementById('scan-out-code').value = code;
    handleScanOutSearch();
}

// -------------------------------
// REFRESH
// -------------------------------
function refreshInventory() {
    displayInventory();
    showMessage('inventory-message', 'Inventory updated', 'success');
}

// -------------------------------
// INIT
// -------------------------------
document.addEventListener('DOMContentLoaded', () => {
    showScreen('scan-in');
});
