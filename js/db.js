// LPG Cylinder Database Manager
class CylinderDB {
    constructor() {
        this.storageKey = 'lpg_cylinders';
        this.movementLogKey = 'lpg_movements';
        this.initDB();
    }

    initDB() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.movementLogKey)) {
            localStorage.setItem(this.movementLogKey, JSON.stringify([]));
        }
    }

    // Get all cylinders
    getAllCylinders() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    }

    // Get cylinder by GLP code
    getCylinderByCode(glpCode) {
        const cylinders = this.getAllCylinders();
        return cylinders.find(c => c.glp_code === glpCode.toUpperCase());
    }

    // Add new cylinder (Scan IN)
    addCylinder(glpCode, brand, weight, status) {
        glpCode = glpCode.toUpperCase();

        // Validate barcode
        if (!glpCode.startsWith('GLP')) {
            return {
                success: false,
                message: 'Invalid barcode. Scan a GLP cylinder only.'
            };
        }

        // Check for duplicates
        if (this.getCylinderByCode(glpCode)) {
            return {
                success: false,
                message: 'Cylinder already exists in inventory'
            };
        }

        const cylinder = {
            glp_code: glpCode,
            brand: brand,
            weight: parseFloat(weight),
            status: status,
            state: 'IN',
            last_updated: new Date().toISOString()
        };

        const cylinders = this.getAllCylinders();
        cylinders.push(cylinder);
        localStorage.setItem(this.storageKey, JSON.stringify(cylinders));

        // Log movement
        this.logMovement(glpCode, 'IN');

        return {
            success: true,
            message: `Cylinder ${glpCode} registered successfully!`,
            cylinder: cylinder
        };
    }

    // Scan OUT cylinder
    scanOutCylinder(glpCode) {
        glpCode = glpCode.toUpperCase();

        // Validate barcode
        if (!glpCode.startsWith('GLP')) {
            return {
                success: false,
                message: 'Invalid barcode. Scan a GLP cylinder only.'
            };
        }

        const cylinder = this.getCylinderByCode(glpCode);

        // Check if exists
        if (!cylinder) {
            return {
                success: false,
                message: 'Cylinder not found in inventory',
                cylinder: null
            };
        }

        // Check if already out
        if (cylinder.state === 'OUT') {
            return {
                success: false,
                message: 'Cylinder already scanned out',
                cylinder: cylinder
            };
        }

        return {
            success: true,
            message: 'Cylinder found',
            cylinder: cylinder
        };
    }

    // Confirm scan out
    confirmScanOut(glpCode) {
        glpCode = glpCode.toUpperCase();
        const cylinders = this.getAllCylinders();
        const index = cylinders.findIndex(c => c.glp_code === glpCode);

        if (index === -1) {
            return {
                success: false,
                message: 'Cylinder not found'
            };
        }

        cylinders[index].state = 'OUT';
        cylinders[index].last_updated = new Date().toISOString();
        localStorage.setItem(this.storageKey, JSON.stringify(cylinders));

        // Log movement
        this.logMovement(glpCode, 'OUT');

        return {
            success: true,
            message: `Cylinder ${glpCode} scanned out successfully!`
        };
    }

    // Get inventory statistics
    getInventoryStats() {
        const cylinders = this.getAllCylinders();
        const inStock = cylinders.filter(c => c.state === 'IN');
        const full = inStock.filter(c => c.status === 'Full');
        const empty = inStock.filter(c => c.status === 'Empty');
        const out = cylinders.filter(c => c.state === 'OUT');

        return {
            total_in: inStock.length,
            total_full: full.length,
            total_empty: empty.length,
            total_out: out.length
        };
    }

    // Get grouped inventory
    getGroupedInventory() {
        const cylinders = this.getAllCylinders().filter(c => c.state === 'IN');
        const brands = {};

        cylinders.forEach(cylinder => {
            if (!brands[cylinder.brand]) {
                brands[cylinder.brand] = {
                    Full: [],
                    Empty: []
                };
            }
            brands[cylinder.brand][cylinder.status].push(cylinder);
        });

        return brands;
    }

    // Log movement
    logMovement(glpCode, action) {
        const movements = JSON.parse(localStorage.getItem(this.movementLogKey)) || [];
        movements.push({
            glp_code: glpCode,
            action: action,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem(this.movementLogKey, JSON.stringify(movements));
    }

    // Get movement log
    getMovementLog() {
        return JSON.parse(localStorage.getItem(this.movementLogKey)) || [];
    }

    // Search cylinders
    searchCylinders(query) {
        const cylinders = this.getAllCylinders();
        return cylinders.filter(c => 
            c.glp_code.includes(query.toUpperCase())
        );
    }

    // Clear all data (for testing)
    clearAll() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.movementLogKey);
        this.initDB();
    }
}

// Initialize database
const db = new CylinderDB();
