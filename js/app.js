// ================================
// LPG INVENTORY SYSTEM (FIXED FULL)
// ================================

let cylinders = JSON.parse(localStorage.getItem("cylinders")) || [];
let selectedCylinder = null;

// ================================
// SAVE
// ================================
function save() {
    localStorage.setItem("cylinders", JSON.stringify(cylinders));
}

// ================================
// NAVIGATION
// ================================
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const screen = btn.getAttribute("data-screen");
        switchScreen(screen);
    });
});

function switchScreen(screen) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(screen).classList.add("active");

    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelector(`[data-screen="${screen}"]`).classList.add("active");

    if (screen === "dashboard") updateDashboard();
    if (screen === "inventory") displayInventory();
    if (screen === "settings") updateSettings();
}

// ================================
// SCAN IN
// ================================
function handleScanIn(e) {
    e.preventDefault();

    const glp = document.getElementById("glpCode").value.trim();
    const brand = document.getElementById("brand").value.trim();
    const weight = document.getElementById("weight").value.trim();
    const status = document.getElementById("status").value;

    if (!glp || !brand || !weight || !status) {
        alert("Fill all fields");
        return;
    }

    const exists = cylinders.find(c => c.glp === glp && c.state === "IN");
    if (exists) {
        alert("Already exists");
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

    save();

    e.target.reset();
    updateDashboard();
    displayInventory();
}

// ================================
// SCAN OUT SEARCH
// ================================
function handleScanOut(e) {
    e.preventDefault();

    const code = document.getElementById("scanOutCode").value.trim();

    selectedCylinder = cylinders.find(c => c.glp === code && c.state === "IN");

    if (!selectedCylinder) {
        alert("Not found");
        return;
    }

    document.getElementById("detailCode").textContent = selectedCylinder.glp;
    document.getElementById("detailBrand").textContent = selectedCylinder.brand;
    document.getElementById("detailWeight").textContent = selectedCylinder.weight;
    document.getElementById("detailStatus").textContent = selectedCylinder.status;
    document.getElementById("detailDate").textContent = new Date(selectedCylinder.date).toLocaleString();

    document.getElementById("cylinderDetails").classList.remove("hidden");
}

// ================================
// CONFIRM SCAN OUT
// ================================
function confirmScanOut() {
    if (!selectedCylinder) return;

    selectedCylinder.state = "OUT";
    selectedCylinder.outDate = new Date().toISOString();

    save();

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
// INVENTORY
// ================================
function displayInventory() {
    const list = document.getElementById("inventoryList");
    list.innerHTML = "";

    const inStock = cylinders.filter(c => c.state === "IN");

    if (inStock.length === 0) {
        list.innerHTML = "<p>No cylinders</p>";
        return;
    }

    inStock.forEach(c => {
        const div = document.createElement("div");
        div.className = "cylinder-card";
        div.innerHTML = `
            <h4>${c.glp}</h4>
            <p>${c.brand}</p>
            <p>${c.weight} kg</p>
            <p>${c.status}</p>
            <button onclick="quickOut('${c.glp}')">Scan Out</button>
        `;
        list.appendChild(div);
    });
}

// ================================
// QUICK SCAN OUT
// ================================
function quickOut(glp) {
    switchScreen("scanOut");
    document.getElementById("scanOutCode").value = glp;
    selectedCylinder = cylinders.find(c => c.glp === glp);
    handleScanOut(new Event("submit"));
}

// ================================
// DASHBOARD
// ================================
function updateDashboard() {
    const inStock = cylinders.filter(c => c.state === "IN");

    document.getElementById("statTotal").textContent = inStock.length;
    document.getElementById("statFull").textContent = inStock.filter(c => c.status === "Full").length;
    document.getElementById("statPartial").textContent = inStock.filter(c => c.status === "Partial").length;
    document.getElementById("statEmpty").textContent = inStock.filter(c => c.status === "Empty").length;
    document.getElementById("statOut").textContent = cylinders.filter(c => c.state === "OUT").length;
}

// ================================
// SETTINGS
// ================================
function updateSettings() {
    document.getElementById("totalRecords").textContent = cylinders.length;
    document.getElementById("inInventoryCount").textContent = cylinders.filter(c => c.state === "IN").length;
    document.getElementById("outCount").textContent = cylinders.filter(c => c.state === "OUT").length;

    const size = new Blob([JSON.stringify(cylinders)]).size;
    document.getElementById("storageUsed").textContent = (size / 1024).toFixed(2) + " KB";
}

// ================================
// EXPORT
// ================================
function exportData() {
    const blob = new Blob([JSON.stringify(cylinders, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "lpg-data.json";
    a.click();
}
