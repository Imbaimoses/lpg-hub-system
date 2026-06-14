// LPG Cylinder Inventory Management App

let currentScanOutCylinder = null;

// Screen Navigation
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

        <canvas class="qr-code"></canvas>

        <button class="btn-scan-out" onclick="scanOutFromInventory('${cylinder.glp_code}')">
            📤 Scan Out
        </button>
    `;

    // Generate QR code
    const canvas = card.querySelector('.qr-code');

    QRCode.toCanvas(
        canvas,
        cylinder.glp_code,
        {
            width: 120,
            margin: 2
        },
        function(error) {
            if (error) {
                console.error(error);
            }
        }
    );

    return card;
}
