// ================================
// REAL QR + BARCODE GENERATOR
// Works with qrcode library CDN
// ================================

class BarcodeGenerator {

    // ----------------------------
    // GENERATE QR CODE IN CANVAS
    // ----------------------------
    static generateQRCode(text, canvasId = "barcode-canvas") {

        return new Promise((resolve, reject) => {

            const canvas = document.getElementById(canvasId);

            if (!canvas) {
                reject("Canvas not found");
                return;
            }

            QRCode.toCanvas(
                canvas,
                text,
                {
                    width: 250,
                    margin: 2,
                    color: {
                        dark: "#000000",
                        light: "#ffffff"
                    }
                },
                function (error) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(canvas);
                    }
                }
            );
        });
    }

    // ----------------------------
    // GENERATE GLP CODE
    // ----------------------------
    static generateGLPCode() {

        const prefix = "GLP";
        const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        let code = prefix;

        for (let i = 0; i < 10; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return code;
    }

    // ----------------------------
    // SHOW QR MODAL
    // ----------------------------
    static async showQRCode(text) {

        const modal = document.getElementById("barcode-modal");

        if (!modal) return;

        modal.classList.add("show");

        try {
            await this.generateQRCode(text);
        } catch (err) {
            console.error("QR Error:", err);
            alert("Failed to generate QR code");
        }
    }

    // ----------------------------
    // DOWNLOAD QR IMAGE
    // ----------------------------
    static downloadBarcode(text) {

        const canvas = document.getElementById("barcode-canvas");

        if (!canvas) return;

        const link = document.createElement("a");

        link.download = `LPG_${text}.png`;
        link.href = canvas.toDataURL("image/png");

        link.click();
    }

    // ----------------------------
    // GENERATE FOR CYLINDER
    // ----------------------------
    static generateForCylinder(cylinder) {

        const data = JSON.stringify({
            code: cylinder.glp_code,
            brand: cylinder.brand,
            weight: cylinder.weight,
            status: cylinder.status,
            time: new Date().toISOString()
        });

        return this.showQRCode(data);
    }

}
