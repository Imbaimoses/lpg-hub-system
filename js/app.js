// ================================
// LPG INVENTORY APP (FIXED)
// ================================

let currentScanOutCylinder = null;

// -------------------------------
// NAVIGATION
// -------------------------------
function showScreen(screen) {

    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

    document.getElementById("screen-" + screen).classList.add("active");
    document.getElementById("nav-" + screen).classList.add("active");

    if (screen === "inventory") {
        refreshInventory();
    }
}

// -------------------------------
// MESSAGE
// -------------------------------
function showMessage(id, msg, type) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.className = "message show " + type;

    setTimeout(() => el.classList.remove("show"), 3000);
}

// ===============================
// SCAN IN
// ===============================
function handleScanIn() {

    const code = document.getElementById("scan-in-code").value.trim();
    const brand = document.getElementById("scan-in-brand").value;
    const weight = document.getElementById("scan-in-weight").value;
    const status = document.getElementById("scan-in-status").value;

    if (!code || !brand || !weight || !status) {
        showMessage("scan-in-message", "Fill all fields", "error");
        return;
    }

    const result = db.addCylinder(code, brand, weight, status);

    if (result.success) {
        showMessage("scan-in-message", result.message, "success");

        document.getElementById("scan-in-code").value = "";
        document.getElementById("scan-in-brand").value = "";
        document.getElementById("scan-in-weight").value = "";
        document.getElementById("scan-in-status").value = "";

    } else {
        showMessage("scan-in-message", result.message, "error");
    }
}

// ===============================
// SCAN OUT
// ===============================
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
    document.getElementById("scan-out-weight").textContent = result.cylinder.weight;
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

// ===============================
// INVENTORY
// ===============================
function refreshInventory() {

    const stats = db.getStats();

    document.getElementById("stat-total").textContent = stats.total;
    document.getElementById("stat-full").textContent = stats.full;
    document.getElementById("stat-empty").textContent = stats.empty;
    document.getElementById("stat-out").textContent = stats.out;

    displayInventory();
}

function displayInventory() {

    const list = document.getElementById("inventory-list");
    list.innerHTML = "";

    const data = db.getAll();

    if (data.length === 0) {
        list.innerHTML = "<p>No inventory</p>";
        return;
    }

    data.forEach(item => {

        const div = document.createElement("div");
        div.className = "cylinder-card";

        div.innerHTML = `
            <h3>${item.glp_code}</h3>
            <p>${item.brand}</p>
            <p>${item.weight} kg</p>
            <p>${item.status}</p>
            <button onclick="startScanOut('${item.glp_code}')">
                Scan Out
            </button>
        `;

        list.appendChild(div);
    });
}

function startScanOut(code) {
    showScreen("scan-out");
    document.getElementById("scan-out-code").value = code;
    handleScanOutSearch();
}

// ===============================
// SEARCH
// ===============================
function filterInventory() {

    const q = document.getElementById("inventory-search").value.toLowerCase();

    const data = db.getAll().filter(c =>
        c.glp_code.toLowerCase().includes(q)
    );

    const list = document.getElementById("inventory-list");
    list.innerHTML = "";

    data.forEach(item => {

        const div = document.createElement("div");

        div.innerHTML = `
            <h3>${item.glp_code}</h3>
            <p>${item.brand}</p>
            <p>${item.weight}</p>
        `;

        list.appendChild(div);
    });
}

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    refreshInventory();
});
