// ================================
// SIMPLE LPG DATABASE (PRODUCTION)
// ================================
class Database {
    constructor() {
        this.storageKey = "lpg_cylinders";
        this.maxStorageAttempts = 3;
        this.initializeData();
    }

    initializeData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            this.data = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error("Failed to parse stored data:", error);
            this.data = [];
        }
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            return { success: true };
        } catch (error) {
            if (error.name === "QuotaExceededError") {
                console.error("Storage quota exceeded. Consider archiving old records.");
                return { success: false, message: "Storage quota exceeded" };
            }
            console.error("Failed to save data:", error);
            return { success: false, message: "Failed to save data" };
        }
    }

    // Validate required fields
    validateCylinder(glp_code, brand, weight, status) {
        if (!glp_code || typeof glp_code !== "string" || glp_code.trim() === "") {
            return { valid: false, message: "Invalid GLP code" };
        }
        if (!brand || typeof brand !== "string" || brand.trim() === "") {
            return { valid: false, message: "Invalid brand" };
        }
        if (!weight || isNaN(weight) || weight <= 0) {
            return { valid: false, message: "Invalid weight" };
        }
        if (!status || !["Full", "Empty", "Partial"].includes(status)) {
            return { valid: false, message: "Invalid status. Must be: Full, Empty, or Partial" };
        }
        return { valid: true };
    }

    // ADD CYLINDER (SCAN IN)
    addCylinder(glp_code, brand, weight, status) {
        // Validate input
        const validation = this.validateCylinder(glp_code, brand, weight, status);
        if (!validation.valid) {
            return { success: false, message: validation.message };
        }

        // Normalize GLP code (trim & uppercase for consistency)
        const normalizedCode = glp_code.trim().toUpperCase();

        // Check for duplicates (case-insensitive)
        const exists = this.data.find(c => 
            c.glp_code.toUpperCase() === normalizedCode && c.state === "IN"
        );
        if (exists) {
            return { success: false, message: "Cylinder already exists in inventory" };
        }

        const cylinder = {
            glp_code: normalizedCode,
            brand: brand.trim(),
            weight: parseFloat(weight),
            status,
            state: "IN",
            timestamp: new Date().toISOString()
        };

        this.data.push(cylinder);
        const saveResult = this.save();
        
        if (!saveResult.success) {
            this.data.pop(); // Rollback
            return saveResult;
        }

        return { success: true, message: "Cylinder added successfully", cylinder };
    }

    // FIND CYLINDER (SCAN OUT SEARCH)
    findCylinder(glp_code) {
        if (!glp_code || typeof glp_code !== "string") {
            return { success: false, message: "Invalid GLP code" };
        }

        const normalizedCode = glp_code.trim().toUpperCase();
        const cylinder = this.data.find(c => 
            c.glp_code === normalizedCode && c.state === "IN"
        );

        if (!cylinder) {
            return { success: false, message: "Cylinder not found or already removed" };
        }

        return { success: true, cylinder };
    }

    // REMOVE CYLINDER (SCAN OUT CONFIRM)
    removeCylinder(glp_code) {
        if (!glp_code || typeof glp_code !== "string") {
            return { success: false, message: "Invalid GLP code" };
        }

        const normalizedCode = glp_code.trim().toUpperCase();
        const index = this.data.findIndex(c => 
            c.glp_code === normalizedCode && c.state === "IN"
        );

        if (index === -1) {
            return { success: false, message: "Cylinder not found or already removed" };
        }

        this.data[index].state = "OUT";
        this.data[index].outTime = new Date().toISOString();

        const saveResult = this.save();
        if (!saveResult.success) {
            // Rollback state change
            this.data[index].state = "IN";
            delete this.data[index].outTime;
            return saveResult;
        }

        return { success: true, message: "Cylinder scanned OUT", outTime: this.data[index].outTime };
    }

    // GET ALL IN INVENTORY
    getAll() {
        return this.data
            .filter(c => c.state === "IN")
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // GET STATS
    getStats() {
        const inInventory = this.data.filter(c => c.state === "IN");
        const outInventory = this.data.filter(c => c.state === "OUT");

        return {
            total: inInventory.length,
            full: inInventory.filter(c => c.status === "Full").length,
            partial: inInventory.filter(c => c.status === "Partial").length,
            empty: inInventory.filter(c => c.status === "Empty").length,
            out: outInventory.length,
            totalWeight: inInventory.reduce((sum, c) => sum + c.weight, 0).toFixed(2)
        };
    }

    // SEARCH (with validation)
    search(query) {
        if (!query || typeof query !== "string") {
            return [];
        }

        const normalizedQuery = query.trim().toUpperCase();
        return this.data.filter(c => 
            c.state === "IN" && (
                c.glp_code.includes(normalizedQuery) ||
                c.brand.toUpperCase().includes(normalizedQuery)
            )
        );
    }

    // ARCHIVE OLD OUT RECORDS
    archiveOldRecords(daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const beforeCount = this.data.length;
        this.data = this.data.filter(c => {
            if (c.state === "OUT" && c.outTime) {
                return new Date(c.outTime) >= cutoffDate;
            }
            return true;
        });

        const archived = beforeCount - this.data.length;
        if (archived > 0) {
            this.save();
            return { success: true, message: `Archived ${archived} old records` };
        }

        return { success: true, message: "No old records to archive" };
    }

    // EXPORT DATA
    exportData() {
        const stats = this.getStats();
        return {
            exportDate: new Date().toISOString(),
            stats,
            records: this.data
        };
    }

    // CLEAR ALL DATA (use with caution)
    clearAll() {
        if (confirm("Are you sure? This will delete all records.")) {
            this.data = [];
            this.save();
            return { success: true, message: "All data cleared" };
        }
        return { success: false, message: "Operation cancelled" };
    }
}

// GLOBAL DB INSTANCE
const db = new Database();
