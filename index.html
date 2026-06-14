// ================================
// SIMPLE LPG INVENTORY SYSTEM
// MATCHES YOUR HTML (CLEAN VERSION)
// ================================

let cylinders = JSON.parse(localStorage.getItem("cylinders")) || [];
let selectedCylinder = null;

// ================================
// SAVE DATA
// ================================
function saveData() {
    localStorage.setItem("cylinders", JSON.stringify(cylinders));
}

// ================================
// NAV DEFAULT LOAD
// ================================
document.addEventListener("DOMContentLoaded", () => {
    updateDashboard();
    displayInventory();
});

// ================================
// SCAN IN
// ================================
function handleScanIn(event) {
    event.preventDefault();

    const glp = document.getElementById("glpCode").value.trim();
    const brand = document.getElementById("brand").value.trim();
    const weight = document.getElementById("weight").value.trim();
    const status = document.getElementById("status").value;

    if (!glp || !brand || !weight || !status) {
        showMsg("scanInMessage", "Fill all fields", "error");
        return;
    }

    const exists = cylinders.find(c => c.glp === glp && c.state === "IN");

    if (exists) {
        showMsg("scanInMessage", "Cylinder already exists", "error");
        return;
    }

    cylinders.push({
        glp,
        brand,
        weight,
        status,
        state: "IN",
        date: new Date().toISOString()
    });

    saveData();

    showMsg("scanInMessage", "Cylinder added successfully", "success");

    document.getElementById("glpCode").value = "";
    document.getElementById("brand").value = "";
    document.getElementById("weight").value = "";
    document.getElementById("status").value = "";

    updateDashboard();
    displayInventory();
}

// ================================
// SCAN OUT SEARCH
// ================================
function handleScanOut(event) {
    event.preventDefault();

    const code = document.getElementById("scanOutCode").value.trim();

    const found = cylinders.find(c => c.glp === code && c.state === "IN");

    if (!found) {
        showMsg("scanOutMessage", "Cylinder not found", "error");
        document.getElementById("cylinderDetails").classList.add("hidden");
        return;
    }

    selectedCylinder = found;

    document.getElementById("detailCode").textContent = found.glp;
    document.getElementById("detailBrand").textContent = found.brand;
    document.getElementById("detailWeight").textContent = found.weight;
    document.getElementById("detailStatus").textContent = found.status;
    document.getElementById("detailDate").textContent = new Date(found.date).toLocaleString();

    document.getElementById("cylinderDetails").classList.remove("hidden");
}

// ================================
// CONFIRM SCAN OUT
// ================================
function confirmScanOut() {

    if (!selectedCylinder) return;

    selectedCylinder.state = "OUT";
    selectedCylinder.outDate = new Date().toISOString();

    saveData();

    showMsg("scanOutMessage", "Cylinder removed", "success");

    cancelScanOut();
    updateDashboard();
    displayInventory();
}

// ================================
// CANCEL SCAN OUT
// ================================
function cancelScanOut() {
    selectedCylinder = null;
    document.getElementById("scanOutCode").value = "";
    document.getElementById("cylinderDetails").classList.add("hidden");
}

// ================================
// INVENTORY DISPLAY
// ================================
function displayInventory() {

    const list = document.getElementById("inventoryList");
    list.innerHTML = "";

    const active = cylinders.filter(c => c.state === "IN");

    if (active.length === 0) {
        list.innerHTML = "<p style='text-align:center;color:#999'>No cylinders</p>";
        return;
    }

    active.forEach(c => {

        const div = document.createElement("div");
        div.className = "cylinder-card";

        div.innerHTML = `
            <h3>${c.glp}</h3>
            <p>${c.brand}</p>
            <p>${c.weight} kg</p>
            <p>${c.status}</p>
            <button onclick="goScanOut('${c.glp}')">Scan Out</button>
        `;

        list.appendChild(div);
    });
}

// ================================
// INVENTORY SEARCH
// ================================
function handleSearch() {

    const q = document.getElementById("searchInput").value.toLowerCase();
    const status = document.getElementById("filterStatus").value;

    let filtered = cylinders.filter(c => c.state === "IN");

    if (q) {
        filtered = filtered.filter(c =>
            c.glp.toLowerCase().includes(q) ||
            c.brand.toLowerCase().includes(q)
        );
    }

    if (status) {
        filtered = filtered.filter(c => c.status === status);
    }

    const list = document.getElementById("inventoryList");
    list.innerHTML = "";

    filtered.forEach(c => {
        const div = document.createElement("div");
        div.className = "cylinder-card";

        div.innerHTML = `
            <h3>${c.glp}</h3>
            <p>${c.brand}</p>
            <p>${c.weight} kg</p>
            <p>${c.status}</p>
        `;

        list.appendChild(div);
    });
}

// ================================
// DASHBOARD
// ================================
function updateDashboard() {

    const inStock = cylinders.filter(c => c.state === "IN");

    const full = inStock.filter(c => c.status === "Full").length;
    const partial = inStock.filter(c => c.status === "Partial").length;
    const empty = inStock.filter(c => c.status === "Empty").length;
    const out = cylinders.filter(c => c.state === "OUT").length;

    document.getElementById("statTotal").textContent = inStock.length;
    document.getElementById("statFull").textContent = full;
    document.getElementById("statPartial").textContent = partial;
    document.getElementById("statEmpty").textContent = empty;
    document.getElementById("statOut").textContent = out;
}

// ================================
// SETTINGS (BASIC)
// ================================
function updateSettingsInfo() {

    document.getElementById("totalRecords").textContent = cylinders.length;
    document.getElementById("inInventoryCount").textContent =
        cylinders.filter(c => c.state === "IN").length;

    document.getElementById("outCount").textContent =
        cylinders.filter(c => c.state === "OUT").length;

    const size = new Blob([JSON.stringify(cylinders)]).size;
    document.getElementById("storageUsed").textContent = (size / 1024).toFixed(2) + " KB";
}

// ================================
// EXPORT JSON
// ================================
function exportData() {

    const data = JSON.stringify(cylinders, null, 2);

    const blob = new Blob([data], { type: "application/json" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "lpg-data.json";
    a.click();
}

// ================================
// CSV DOWNLOAD
// ================================
function downloadCSV() {

    let csv = "GLP,Brand,Weight,Status,State\n";

    cylinders.forEach(c => {
        csv += `${c.glp},${c.brand},${c.weight},${c.status},${c.state}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "lpg-data.csv";
    a.click();
}

// ================================
// CLEAR ALL DATA
// ================================
function clearAllData() {
    if (confirm("Delete ALL data?")) {
        cylinders = [];
        saveData();
        updateDashboard();
        displayInventory();
    }
}

// ================================
// ARCHIVE (SIMPLE)
// ================================
function archiveRecords() {
    const days = parseInt(document.getElementById("archiveDays").value);

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    cylinders = cylinders.filter(c => new Date(c.date).getTime() > cutoff);

    saveData();
    updateDashboard();
    displayInventory();

    alert("Old records removed");
}

// ================================
// NAV HELPERS
// ================================
function goScanOut(glp) {
    switchScreenByName("scanOut");
    document.getElementById("scanOutCode").value = glp;
    handleScanOut(new Event("submit"));
}

// ================================
// MESSAGE HELPER
// ================================
function showMsg(id, msg, type) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.className = "message show " + type;

    setTimeout(() => el.classList.remove("show"), 3000);
}
