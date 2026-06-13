// Barcode Generator using JsBarcode library pattern
class BarcodeGenerator {
    // Generate simple barcode representation
    static generateGLPCode() {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code = 'GLP';
        for (let i = 0; i < 12; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // Create barcode image using canvas
    static createBarcodeImage(glpCode, canvasId = null) {
        const canvas = canvasId ? document.getElementById(canvasId) : document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const width = 300;
        const height = 100;
        canvas.width = width;
        canvas.height = height;

        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // Black border
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, width, height);

        // Draw bars based on code
        const barWidth = width / glpCode.length;
        ctx.fillStyle = 'black';

        for (let i = 0; i < glpCode.length; i++) {
            const charCode = glpCode.charCodeAt(i);
            const barHeight = 50 + (charCode % 30);
            ctx.fillRect(
                i * barWidth + 5,
                height - barHeight - 10,
                barWidth - 2,
                barHeight
            );
        }

        // Draw text
        ctx.fillStyle = 'black';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(glpCode, width / 2, height - 5);

        return canvas;
    }

    // Download barcode as image
    static downloadBarcode(glpCode) {
        const canvas = this.createBarcodeImage(glpCode);
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `barcode_${glpCode}.png`;
        link.click();
    }

    // Encode Code128 style barcode
    static encodeCode128(text) {
        const code128Table = {
            ' ': '00', '!': '01', '"': '02', '#': '03', '$': '04',
            '%': '05', '&': '06', "'": '07', '(': '08', ')': '09',
            '*': '10', '+': '11', ',': '12', '-': '13', '.': '14',
            '/': '15', '0': '16', '1': '17', '2': '18', '3': '19',
            '4': '20', '5': '21', '6': '22', '7': '23', '8': '24',
            '9': '25', ':': '26', ';': '27', '<': '28', '=': '29',
            '>': '30', '?': '31', '@': '32', 'A': '33', 'B': '34',
            'C': '35', 'D': '36', 'E': '37', 'F': '38', 'G': '39'
        };
        
        let encoded = '';
        for (let char of text) {
            encoded += code128Table[char] || '63';
        }
        return encoded;
    }
}
