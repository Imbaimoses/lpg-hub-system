// js/qr.js
const QRGenerator = {
    generateQR(text, canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        QRCode.toCanvas(canvas, text, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.95,
            margin: 1,
            width: 200,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        }, (error) => {
            if (error) console.error('QR Generation Error:', error);
        });
    },

    generateQRInCard(glp) {
        const canvas = document.createElement('canvas');
        canvas.style.maxWidth = '150px';
        canvas.style.border = '1px solid #ddd';
        canvas.style.borderRadius = '8px';
        canvas.style.padding = '8px';

        QRCode.toCanvas(canvas, glp, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.95,
            margin: 1,
            width: 200,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        }, (error) => {
            if (error) console.error('QR Generation Error:', error);
        });

        return canvas;
    }
};
