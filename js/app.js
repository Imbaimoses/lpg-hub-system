// Generate QR code for each cylinder
function generateQRCode(glpCode, containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = ''; // Clear previous QR
        new QRCode(container, {
            text: glpCode,
            width: 150,
            height: 150,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}

// Updated cylinder card with QR code
function createCylinderCard(cylinder) {
    const date = new Date(cylinder.timestamp).toLocaleDateString();
    const statusColor = {
        'Full': '#28a745',
        'Partial': '#ffc107',
        'Empty': '#e74c3c'
    }[cylinder.status] || '#999';

    const qrId = `qr_${cylinder.glp_code}_${Date.now()}`;

    return `
        <div class="cylinder-card">
            <div class="cylinder-code">${cylinder.glp_code}</div>
            <div id="${qrId}" class="qr-code-container" style="text-align: center; margin: 1rem 0;"></div>
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
                    <span class="info-value" style="color: ${statusColor};">● ${cylinder.status}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Added:</span>
                    <span class="info-value">${date}</span>
                </div>
            </div>
            <button class="btn-scan-out" onclick="quickScanOut('${cylinder.glp_code}')">Scan Out</button>
        </div>
    `;
}
