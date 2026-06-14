// Barcode + QR Code Generator (CLEAN FIX)

class BarcodeGenerator {

    // Generate GLP code (safe format)
    static generateGLPCode() {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code = 'GLP';

        for (let i = 0; i < 9; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return code;
    }

    // Generate QR Code (REAL one using QRCode library)
    static generateQRCode(canvas, glpCode) {
        if (!canvas || !glpCode) return;

        QRCode.toCanvas(canvas, glpCode, {
            width: 120,
            margin: 1,
            color: {
                dark: "#000000",
                light: "#ffffff"
            }
        }, function (error) {
            if (error) {
                console.error("QR generation error:", error);
            }
        });
    }

    // Download QR Code
    static downloadQRCode(glpCode) {
        const canvas = document.createElement("canvas");

        QRCode.toCanvas(canvas, glpCode, function (err) {
            if (err) return console.error(err);

            const link = document.createElement('a');
            link.href = canvas.toDataURL("image/png");
            link.download = `GLP_${glpCode}.png`;
            link.click();
        });
    }
}
