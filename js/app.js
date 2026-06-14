// ================================ // SIMPLE LPG DATABASE (CORE STORAGE ENGINE) // ================================ 
class Database {
    constructor() {
        this.storageKey = "lpg_cylinders";
        this.data = JSON.parse(localStorage.getItem(this.storageKey)) || [];
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    // --------------------------- // ADD CYLINDER (SCAN IN) // --------------------------- 
    addCylinder(glp_code, brand, weight, status) {
        const exists = this.data.find(c => c.glp_code === glp_code && c.state === "IN");
        if (exists) {
            return { success: false, message: "Cylinder already exists in inventory" };
        }
        const cylinder = { 
            glp_code, 
            brand, 
            weight, 
            status, 
            state: "IN", 
            timestamp: new Date().toISOString() 
        };
        this.data.push(cylinder);
        this.save();
        return { success: true, message: "Cylinder added successfully" };
    }

    // --------------------------- // FIND CYLINDER (SCAN OUT SEARCH) // --------------------------- 
    findCylinder(glp_code) {
        const cylinder = this.data.find(c => c.glp_code === glp_code && c.state === "IN");
        if (!cylinder) {
            return { success: false };
        }
        return { success: true, cylinder };
    }

    // --------------------------- // REMOVE CYLINDER (SCAN OUT CONFIRM) // --------------------------- 
    removeCylinder(glp_code) {
        const index = this.data.findIndex(c => c.glp_code === glp_code && c.state === "IN");
        if (index === -1) {
            return { success: false, message: "Cylinder not found or already removed" };
        }
        this.data[index].state = "OUT";
        this.data[index].outTime = new Date().toISOString();
        this.save();
        return { success: true, message: "Cylinder scanned OUT" };
    }

    // --------------------------- // GET ALL IN INVENTORY // --------------------------- 
    getAll() {
        return this.data.filter(c => c.state === "IN");
    }

    // --------------------------- // STATS // --------------------------- 
    getStats() {
        const total = this.data.filter(c => c.state === "IN").length;
        const full = this.data.filter(c => c.state === "IN" && c.status === "Full").length;
        const empty = this.data.filter(c => c.state === "IN" && c.status === "Empty").length;
        const out = this.data.filter(c => c.state === "OUT").length;
        return { total, full, empty, out };
    }

    // --------------------------- // SEARCH // --------------------------- 
    search(query) {
        return this.data.filter(c => c.glp_code.includes(query) && c.state === "IN");
    }
}

// Global Database Instance
const db = new Database();


// ================================ // LPG INVENTORY CONTROLLER (UI RENDER LAYER) // ================================ 
let currentScanOutCylinder = null;

// ------------------------------- // NAVIGATION MANAGER // ------------------------------- 
function showScreen(screen) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    
    document.getElementById("screen-" + screen).classList.add("active");
    document.getElementById("nav-" + screen).classList.add("active");
    
    if (screen === "inventory") {
        refreshInventory();
    }
}

// ------------------------------- // NOTIFICATION ALERTS // ------------------------------- 
function showMessage(id, msg, type) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.className = "message show " + type;
    setTimeout(() => el.classList.remove("show"), 3000);
}

// =============================== // SCAN IN WORKFLOW // =============================== 
function handleScanIn() {
    const codeEl = document.getElementById("scan-in-code");
    const brandEl = document.getElementById("scan-in-brand");
    const weightEl = document.getElementById("scan-in-weight");
    const statusEl = document.getElementById("scan-in-status");

    const code = codeEl.value.trim();
    const brand = brandEl.value;
    const weight = weightEl.value;
    const status = statusEl.value;

    if (!code || !brand || !weight || !status) {
        showMessage("scan-in-message", "Fill all fields", "error");
        return;
    }

    const result = db.addCylinder(code, brand, weight, status);
    
    if (result.success) {
        showMessage("scan-in-message", result.message, "success");
        // Clear text safely and revert options back to select prompts index 0
        codeEl.value = "";
        brandEl.selectedIndex = 0;
        weightEl.selectedIndex = 0;
        statusEl.selectedIndex = 0;
    } else {
        showMessage("scan-in-message", result.message, "error");
    }
}

// =============================== // SCAN OUT WORKFLOW // =============================== 
function handleScanOutSearch() {
    const code = document.getElementById("scan-out-code").value.trim();
    const result = db.findCylinder(code);

    if (!result.success) {
        showMessage("scan-out-message", "Cylinder not found", "error");
        document.getElementById("scan-out-details").classList.add("hidden");
        return;
    }

    currentScanOutCylinder = result.cylinder;
    document.getElementById("scan-out-glp").textContent = result.cylinder.glp_code;
    document.getElementById("scan-out-brand").textContent = result.cylinder.brand;
    document.getElementById("scan-out-weight").textContent = result.cylinder.weight + " kg";
    document.getElementById("scan-out-status").textContent = result.cylinder.status;
    document.getElementById("scan-out-details").classList.remove("hidden");
}

function handleConfirmScanOut() {
    if (!currentScanOutCylinder) {
        showMessage("scan-out-message", "No cylinder selected", "error");
        return;
    }

    const result = db.removeCylinder(currentScanOutCylinder.glp_code);
    
    if (result.success) {
        showMessage("scan-out-message", result.message, "success");
        resetScanOut();
        refreshInventory();
    } else {
        showMessage("scan-out-message", result.message, "error");
    }
}

function resetScanOut() {
    document.getElementById("scan-out-code").value = "";
    document.getElementById("scan-out-details").classList.add("hidden");
    currentScanOutCylinder = null;
}

// =============================== // INVENTORY ENGINE RECONCILIATION // =============================== 
function refreshInventory() {
    const stats = db.getStats();
    document.getElementById("stat-total").textContent = stats.total;
    document.getElementById("stat-full").textContent = stats.full;
    document.getElementById("stat-empty").textContent = stats.empty;
    document.getElementById("stat-out").textContent = stats.out;
    displayInventory();
}

// Component template function used to keep dashboard view and filtered query view layout structures perfectly uniform
function buildCylinderCard(item) {
    const div = document.createElement("div");
    div.className = "cylinder-card";
    div.innerHTML = `
        <h3>${item.glp_code}</h3>
        <p><strong>Brand:</strong> ${item.brand}</p>
        <p><strong>Weight:</strong> ${item.weight} kg</p>
        <p><strong>Status:</strong> ${item.status}</p>
        <button class="scan-out-btn" onclick="startScanOut('${item.glp_code}')">Scan Out</button>
    `;
    return div;
}

function displayInventory() {
    const list = document.getElementById("inventory-list");
    list.innerHTML = "";
    const data = db.getAll();

    if (data.length === 0) {
        list.innerHTML = "<p class='no-data'>No active cylinders in inventory</p>";
        return;
    }

    data.forEach(item => {
        list.appendChild(buildCylinderCard(item));
    });
}

function startScanOut(code) {
    showScreen("scan-out");
    document.getElementById("scan-out-code").value = code;
    handleScanOutSearch();
}

// =============================== // SEARCH QUERY FILTER ENGINE // =============================== 
function filterInventory() {
    const q = document.getElementById("inventory-search").value.toLowerCase();
    const data = db.getAll().filter(c => c.glp_code.toLowerCase().includes(q));
    const list = document.getElementById("inventory-list");
    
    list.innerHTML = "";

    if (data.length === 0) {
        list.innerHTML = "<p class='no-data'>No cylinders match search criteria</p>";
        return;
    }

    data.forEach(item => {
        list.appendChild(buildCylinderCard(item));
    });
}

// =============================== // APPLICATION INITIALIZER // =============================== 
document.addEventListener("DOMContentLoaded", () => {
    refreshInventory();
});
