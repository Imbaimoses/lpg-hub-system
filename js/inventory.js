// js/inventory.js
const Inventory = {
    storageKey: 'lpg_cylinders',

    getAll() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    },

    save(cylinders) {
        localStorage.setItem(this.storageKey, JSON.stringify(cylinders));
    },

    add(cylinder) {
        const cylinders = this.getAll();
        
        const duplicate = cylinders.find(c => c.glp === cylinder.glp && c.state === 'IN');
        if (duplicate) {
            throw new Error(`Cylinder ${cylinder.glp} already exists in inventory`);
        }

        cylinder.id = Date.now().toString();
        cylinder.createdAt = new Date().toISOString();
        cylinders.push(cylinder);
        this.save(cylinders);
        return cylinder;
    },

    findByGlp(glp) {
        const cylinders = this.getAll();
        return cylinders.find(c => c.glp === glp && c.state === 'IN');
    },

    markAsOut(id) {
        const cylinders = this.getAll();
        const cylinder = cylinders.find(c => c.id === id);
        if (cylinder) {
            cylinder.state = 'OUT';
            cylinder.scannedOutAt = new Date().toISOString();
            this.save(cylinders);
        }
        return cylinder;
    },

    getInStock() {
        return this.getAll().filter(c => c.state === 'IN');
    },

    getFullCylinders() {
        return this.getAll().filter(c => c.state === 'IN' && c.status === 'Full');
    },

    getEmptyCylinders() {
        return this.getAll().filter(c => c.state === 'IN' && c.status === 'Empty');
    },

    getScannedOut() {
        return this.getAll().filter(c => c.state === 'OUT');
    },

    validateWeight(weight, status) {
        const w = parseFloat(weight);
        
        if (isNaN(w)) {
            throw new Error('Weight must be a valid number');
        }

        if (status === 'Full') {
            if (w < 24.0 || w > 25.0) {
                throw new Error('Full cylinder weight must be between 24.0 kg and 25.0 kg');
            }
        } else if (status === 'Empty') {
            if (w < 11.0 || w > 25.0) {
                throw new Error('Empty cylinder weight must be between 11.0 kg and 25.0 kg');
            }
        }

        return true;
    }
};
