// ================================
// QR CODE GENERATOR FOR CYLINDERS
// ================================

function generateCylinderQR(glpCode, weight, count) {
    // Create cylinder data
    const cylinderData = `GLP:${glpCode}|WEIGHT:${weight}kg|COUNT:${count}`;
    
    // Create container
    const qrContainer = document.createElement('div');
    qrContainer.id = 'qrcode_' + count;
    qrContainer.style.margin = '10px';
    qrContainer.style.padding = '15px';
    qrContainer.style.border = '2px solid #333';
    qrContainer.style.borderRadius = '8px';
    qrContainer.style.display = 'inline-block';
    qrContainer.style.backgroundColor = '#fff';
    qrContainer.style.textAlign = 'center';
    
    // Add cylinder info
    const info = document.createElement('div');
    info.style.marginBottom = '10px';
    info.style.fontSize = '16px';
    info.style.fontWeight = 'bold';
    info.innerHTML = `
        <div style="font-size: 18px; margin-bottom: 5px;">${glpCode}</div>
        <div style="font-size: 14px; color: #666;">${weight}kg</div>
        <div style="font-size: 12px; color: #999;">#${count}</div>
    `;
    
    qrContainer.appendChild(info);
    
    // Generate QR code using the library already loaded
    new QRCode(qrContainer, {
        text: cylinderData,
        width: 150,
        height: 150,
        colorDark: "#000000",
        colorLight: "#ffffff"
    });
    
    return qrContainer;
}

// Display all cylinders with QR codes
function displayCylindersWithQR() {
    const container = document.getElementById('qrCodeDisplay');
    if (!container) return;
    
    container.innerHTML = ''; // Clear previous
    const cylinders = db.getAll();
    
    if (cylinders.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No cylinders in inventory</p>';
        return;
    }
    
    cylinders.forEach((cylinder, index) => {
        const qr = generateCylinderQR(cylinder.glp_code, cylinder.weight, index + 1);
        container.appendChild(qr);
    });
}

// Call on page load
document.addEventListener('DOMContentLoaded', displayCylindersWithQR);
