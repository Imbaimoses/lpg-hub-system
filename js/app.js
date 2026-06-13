// LPG Cylinder Inventory Management App

let currentScanOutCylinder = null;

// Screen Navigation
function showScreen(screenName) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected screen
    const screenId = `screen-${screenName}`;
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
    }

    // Mark nav button as active
    const navBtn = document.getElementById(`nav-${screenName}`);
    if (navBtn) {
        navBtn.classList.add('active');
    }

    // Focus appropriate input
    setTimeout(() => {
        if (screenName === 'scan-in') {
            document.getElementById('scan-in-code').focus();
        } else if (screenName === 'scan-out') {
            document.getElementById('scan-out-code').focus();
        }
    }, 100);
}

// Message Handler
function showMessage(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `message show ${type}`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}

// ========== SCAN IN FUNCTIONS ==========

function handleScanIn() {
    const code = document.getElementById('scan-in-code').value.trim();
    const brand = document.getElementById('scan-in-brand').value;
    const weight = document.getElementById('scan-in-weight').value;
    const status = document.getElementById('scan-in-status').value;

    // Validation
    if (!code) {
        showMessage('scan-in-message', 'Please enter GLP code', 'error');
        return;
    }
    if (!brand) {
        showMessage('scan-in-message', 'Please select a brand', 'error');
        return;
    }
    if (!weight) {
        showMessage('scan-in-message', 'Please enter weight', 'error');
        return;
    }
    if (!status) {
        showMessage('scan-in-message', 'Please select status', 'error');
        return;
    }

    // Add cylinder to database
    const result = db.addCylinder(code, brand, weight, status);

    if (result.success) {
        showMessage('scan-in-message', result.message, 'success');
        
        // Clear form
        document.getElementById('scan-in-code').value = '';
        document.getElementById('scan-in-brand').value = '';
        document.getElementById('scan-in-weight').value = '';
        document.getElementById('scan-in-status').value = '';
        
        // Focus back to barcode input
        document.getElementById('scan-in-code').focus();
    } else {
        showMessage('scan-in-message', result.message, 'error');
    }
}

// Handle Enter key on Scan IN
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('scan-in-code')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('scan-in-brand').focus();
        }
    });
});

// ========== SCAN OUT FUNCTIONS ==========

function handleScanOutSearch() {
    const code = document.getElementById('scan-out-code').value.trim();

    if (!code) {
        showMessage('scan-out-message', 'Please enter GLP code', 'error');
        return;
    }

    const result = db.scanOutCylinder(code);

    if (result.success) {
        // Display cylinder details
        currentScanOutCylinder = result.cylinder;
        displayScanOutDetails(result.cylinder);
        showMessage('scan-out-message', result.message, 'info');
    } else {
        showMessage('scan-out-message', result.message, 'error');
        document.getElementById('scan-out-details').classList.add('hidden');
    }
}

function displayScanOutDetails(cylinder) {
    document.getElementById('scan-out-glp').textContent = cylinder.glp_code;
    document.getElementById('scan-out-brand').textContent = cylinder.brand;
    document.getElementById('scan-out-weight').textContent = `${cylinder.weight} kg`;
    document.getElementById('scan-out-status').textContent = cylinder.status;
    document.getElementById('scan-out-details').classList.remove('hidden');
}

function handleConfirmScanOut() {
    if (!currentScanOutCylinder) {
        showMessage('scan-out-message', 'No cylinder selected', 'error');
        return;
    }

    const result = db.confirmScanOut(currentScanOutCylinder.glp_code);

    if (result.success) {
        showMessage('scan-out-message', result.message, 'success');
        resetScanOut();
    } else {
        showMessage('scan-out-message', result.message, 'error');
    }
}

function resetScanOut() {
    document.getElementById('scan-out-code').value = '';
    document.getElementById('scan-out-details').classList.add('hidden');
    currentScanOutCylinder = null;
    document.getElementById('scan-out-code').focus();
}

// Handle Enter key on Scan OUT
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('scan-out-code')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleScanOutSearch();
        }
    });
});

// ========== INVENTORY FUNCTIONS ==========

function displayInventory() {
    const grouped = db.getGroupedInventory();
    const container = document.getElementById('inventory-list');
    container.innerHTML = '';

    const brands = ['PayGo', 'Wajiko', 'GreenWells'];
    
    let hasContent = false;

    brands.forEach(brand => {
        if (grouped[brand]) {
            hasContent = true;
            const brandSection = document.createElement('div');
            brandSection.className = 'brand-section';
            
            const brandTitle = document.createElement('h3');
            brandTitle.className = 'brand-title';
            brandTitle.textContent = `${brand}`;
            brandSection.appendChild(brandTitle);

            // Full cylinders
            if (grouped[brand]['Full'].length > 0) {
                const statusGroup = document.createElement('div');
                statusGroup.className = 'status-group';
                
                const statusLabel = document.createElement('div');
                statusLabel.className = 'status-label';
                statusLabel.textContent = '🔵 Full Cylinders';
                statusGroup.appendChild(statusLabel);

                grouped[brand]['Full'].forEach(cylinder => {
                    const card = createCylinderCard(cylinder);
                    statusGroup.appendChild(card);
                });

                brandSection.appendChild(statusGroup);
            }

            // Empty cylinders
            if (grouped[brand]['Empty'].length > 0) {
                const statusGroup = document.createElement('div');
                statusGroup.className = 'status-group';
                
                const statusLabel = document.createElement('div');
                statusLabel.className = 'status-label';
                statusLabel.textContent = '⚪ Empty Cylinders';
                statusGroup.appendChild(statusLabel);

                grouped[brand]['Empty'].forEach(cylinder => {
                    const card = createCylinderCard(cylinder);
                    statusGroup.appendChild(card);
                });

                brandSection.appendChild(statusGroup);
            }

            container.appendChild(brandSection);
        }
    });

    if (!hasContent) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #999;">No cylinders in inventory</div>';
    }
}

function createCylinderCard(cylinder) {
    const card = document.createElement('div');
    card.className = 'cylinder-card';
    
    const statusIcon = cylinder.status === 'Full' ? '🔵' : '⚪';
    
    card.innerHTML = `
        <div class="cylinder-code">${cylinder.glp_code}</div>
        <div class="cylinder-info">
            <div class="info-item">
                <span class="info-label">Brand:</span>
                <span class="info-value">${cylinder.brand}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Weight:</span>
                <span class="info-value">${cylinder.weight} kg</span>
            </div>
            <div class="info-item">
                <span class="info-label">Status:</span>
                <span class="info-value">${statusIcon} ${cylinder.status}</span>
            </div>
        </div>
        <div class="barcode-placeholder">Barcode Image</div>
        <button class="btn-scan-out" onclick="scanOutFromInventory('${cylinder.glp_code}')">
            📤 Scan Out
        </button>
    `;
    
    return card;
}

function scanOutFromInventory(glpCode) {
    showScreen('scan-out');
    document.getElementById('scan-out-code').value = glpCode;
    handleScanOutSearch();
}

function refreshInventory() {
    updateInventoryStats();
    displayInventory();
    showMessage('inventory-message', 'Inventory refreshed', 'success');
}

function updateInventoryStats() {
    const stats = db.getInventoryStats();
    document.getElementById('stat-total').textContent = stats.total_in;
    document.getElementById('stat-full').textContent = stats.total_full;
    document.getElementById('stat-empty').textContent = stats.total_empty;
    document.getElementById('stat-out').textContent = stats.total_out;
}

function filterInventory() {
    const query = document.getElementById('inventory-search').value.trim();
    
    if (!query) {
        displayInventory();
        return;
    }

    const results = db.searchCylinders(query);
    const inStock = results.filter(c => c.state === 'IN');
    
    const container = document.getElementById('inventory-list');
    container.innerHTML = '';

    if (inStock.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #999;">No matching cylinders found</div>';
        return;
    }

    inStock.forEach(cylinder => {
        const card = createCylinderCard(cylinder);
        container.appendChild(card);
    });
}

// ========== MODAL FUNCTIONS ==========

function openModal() {
    const modal = document.getElementById('barcode-modal');
    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('barcode-modal');
    modal.classList.remove('show');
}

function downloadBarcode() {
    const glpCode = document.getElementById('scan-out-glp').textContent;
    if (glpCode) {
        BarcodeGenerator.downloadBarcode(glpCode);
    }
}

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', () => {
    // Initialize with Scan IN screen
    showScreen('scan-in');
    
    // Update inventory stats when loading inventory screen
    document.getElementById('nav-inventory')?.addEventListener('click', () => {
        updateInventoryStats();
        displayInventory();
    });

    // Allow scanning with Enter key
    document.getElementById('scan-out-code')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleScanOutSearch();
        }
    });
});
