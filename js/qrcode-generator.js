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
    qrContainer.style.padding = '10px';
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
        <div>${glpCode}</div>
        <div>${weight}kg</div>
        <div>#${count}</div>
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
