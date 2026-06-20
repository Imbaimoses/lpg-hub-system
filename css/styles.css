// js/app.js
class LPGApp {
    constructor() {
        this.currentCylinder = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDashboard();
        this.renderInventory();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchSection(e.target.closest('.nav-btn').dataset.section));
        });

        // Scan IN Form
        document.getElementById('scanInForm').addEventListener('submit', (e) => this.handleScanIn(e));

        // Scan OUT Form
        document.getElementById('scanOutForm').addEventListener('submit', (e) => this.handleScanOut(e));

        // Confirm Scan Out
        document.getElementById('confirmScanOut').addEventListener('click', () => this.confirmScanOut());

        // Inventory Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchInventoryTab(e.target.dataset.tab));
        });
    }

    switchSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
        document.getElementById(sectionId).classList.add('active');

        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

        if (sectionId === 'inventory') {
            this.renderInventory();
        }
    }

    switchInventoryTab(tab) {
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tab).classList.add('active');

        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        this.renderInventory();
    }

    handleScanIn(e) {
        e.preventDefault();

        const glpCode = document.getElementById('glpCode').value.trim().toUpperCase();
        const brand = document.getElementById('brand').value;
        const status = document.getElementById('status').value;
        const weight = document.getElementById('weight').value;

        const messageDiv = document.getElementById('scanInMessage');
        messageDiv.className = 'message';

        try {
            if (!glpCode || !brand || !status || !weight) {
                throw new Error('All fields are required');
            }

            Inventory.validateWeight(weight, status);

            const cylinder = {
                glp: glpCode,
                brand,
                status,
                weight: parseFloat(weight),
                state: 'IN'
            };

            Inventory.add(cylinder);

            messageDiv.className = 'message success';
            messageDiv.textContent = `✓ Cylinder ${glpCode} registered successfully!`;

            this.generateQRForScanIn(glpCode);

            document.getElementById('scanInForm').reset();
            this.updateDashboard();

            setTimeout(() => {
                messageDiv.className = 'message';
            }, 5000);

        } catch (error) {
            messageDiv.className = 'message error';
            messageDiv.textContent = `✗ Error: ${error.message}`;
        }
    }

    generateQRForScanIn(glpCode) {
        const qrContainer = document.getElementById('qrContainer');
        const qrGlp = document.getElementById('qrGlp');
        
        qrGlp.textContent = glpCode;
        
        setTimeout(() => {
            QRGenerator.generateQR(glpCode, 'qrCanvas');
            qrContainer.style.display = 'block';
        }, 100);
    }

    handleScanOut(e) {
        e.preventDefault();

        const glpCodeOut = document.getElementById('glpCodeOut').value.trim().toUpperCase();
        const messageDiv = document.getElementById('scanOutMessage');
        const cylinderDetails = document.getElementById('cylinderDetails');

        messageDiv.className = 'message';
        cylinderDetails.style.display = 'none';

        try {
            if (!glpCodeOut) {
                throw new Error('Please enter a GLP Code');
            }

            const cylinder = Inventory.findByGlp(glpCodeOut);

            if (!cylinder) {
                throw new Error(`Cylinder ${glpCodeOut} not found in inventory`);
            }

            this.currentCylinder = cylinder;

            document.getElementById('detailGlp').textContent = cylinder.glp;
            document.getElementById('detailBrand').textContent = cylinder.brand;
            document.getElementById('detailWeight').textContent = `${cylinder.weight} kg`;
            
            const statusElement = document.getElementById('detailStatus');
            statusElement.textContent = cylinder.status;
            statusElement.className = `detail-value status-${cylinder.status.toLowerCase()}`;

            setTimeout(() => {
                QRGenerator.generateQR(cylinder.glp, 'detailQrCanvas');
                cylinderDetails.style.display = 'block';
            }, 100);

            messageDiv.className = 'message success';
            messageDiv.textContent = `✓ Cylinder found!`;

            document.getElementById('scanOutForm').reset();

        } catch (error) {
            messageDiv.className = 'message error';
            messageDiv.textContent = `✗ Error: ${error.message}`;
        }
    }

    confirmScanOut() {
        if (!this.currentCylinder) return;

        try {
            Inventory.markAsOut(this.currentCylinder.id);

            const messageDiv = document.getElementById('scanOutMessage');
            messageDiv.className = 'message success';
            messageDiv.textContent = `✓ Cylinder ${this.currentCylinder.glp} scanned out successfully!`;

            document.getElementById('cylinderDetails').style.display = 'none';
            this.currentCylinder = null;

            this.updateDashboard();

            setTimeout(() => {
                messageDiv.className = 'message';
            }, 5000);

        } catch (error) {
            const messageDiv = document.getElementById('scanOutMessage');
            messageDiv.className = 'message error';
            messageDiv.textContent = `✗ Error: ${error.message}`;
        }
    }

    renderInventory() {
        const allCylinders = Inventory.getInStock();
        const fullCylinders = Inventory.getFullCylinders();
        const emptyCylinders = Inventory.getEmptyCylinders();

        this.renderTab('all', allCylinders);
        this.renderTab('full', fullCylinders);
        this.renderTab('empty', emptyCylinders);
    }

    renderTab(tabId, cylinders) {
        const tabContent = document.getElementById(tabId);
        
        if (cylinders.length === 0) {
            tabContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <p>No cylinders in this category</p>
                </div>
            `;
            return;
        }

        const cardsHtml = cylinders.map(cylinder => `
            <div class="cylinder-card">
                <div class="card-header">
                    <div class="glp-code">${cylinder.glp}</div>
                    <span class="status-badge status-${cylinder.status.toLowerCase()}">${cylinder.status}</span>
                </div>
                <div class="card-info">
                    <div class="info-row">
                        <span class="info-label">Brand:</span>
                        <span>${cylinder.brand}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Weight:</span>
                        <span>${cylinder.weight} kg</span>
                    </div>
                </div>
                <div class="card-qr" id="qr-${cylinder.id}"></div>
                <button class="card-button" data-id="${cylinder.id}">Scan Out</button>
            </div>
        `).join('');

        tabContent.innerHTML = `<div class="cards-grid">${cardsHtml}</div>`;

        cylinders.forEach(cylinder => {
            const qrContainer = document.getElementById(`qr-${cylinder.id}`);
            if (qrContainer) {
                const qrCanvas = QRGenerator.generateQRInCard(cylinder.glp);
                qrContainer.appendChild(qrCanvas);
            }
        });

        document.querySelectorAll('.card-button').forEach(btn => {
            btn.addEventListener('click', () => {
                const cylinderId = btn.dataset.id;
                const cylinder = cylinders.find(c => c.id === cylinderId);
                if (cylinder) {
                    document.getElementById('glpCodeOut').value = cylinder.glp;
                    this.switchSection('scan-out');
                    const form = document.getElementById('scanOutForm');
                    form.dispatchEvent(new Event('submit'));
                }
            });
        });
    }

    updateDashboard() {
        document.getElementById('totalInStock').textContent = Inventory.getInStock().length;
        document.getElementById('fullCylinders').textContent = Inventory.getFullCylinders().length;
        document.getElementById('emptyCylinders').textContent = Inventory.getEmptyCylinders().length;
        document.getElementById('scannedOut').textContent = Inventory.getScannedOut().length;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LPGApp();
});
