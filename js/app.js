<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LPG Cylinder Inventory System</title>
    <link rel="stylesheet" href="css/styles.css">
</head>

<body>
<div id="app">

    <!-- NAVBAR -->
    <nav class="navbar">
        <div class="navbar-brand">LPG Hub System</div>

        <div class="navbar-nav">
            <button id="nav-scan-in" class="nav-btn active" onclick="showScreen('scan-in')">
                📥 Scan IN
            </button>

            <button id="nav-scan-out" class="nav-btn" onclick="showScreen('scan-out')">
                📤 Scan OUT
            </button>

            <button id="nav-inventory" class="nav-btn" onclick="showScreen('inventory')">
                📊 Inventory
            </button>
        </div>
    </nav>

    <!-- MAIN -->
    <main class="container">

        <!-- SCAN IN -->
        <section id="screen-scan-in" class="screen active">
            <div class="screen-content">
                <h2>📥 Scan IN</h2>

                <input id="scan-in-code" class="barcode-input" placeholder="GLP Code">

                <select id="scan-in-brand" class="form-control">
                    <option value="">Select Brand</option>
                    <option>PayGo</option>
                    <option>Wajiko</option>
                    <option>GreenWells</option>
                </select>

                <input id="scan-in-weight" class="form-control" placeholder="Weight (kg)">

                <select id="scan-in-status" class="form-control">
                    <option value="">Select Status</option>
                    <option value="Full">Full</option>
                    <option value="Empty">Empty</option>
                </select>

                <button class="btn btn-primary btn-lg" onclick="handleScanIn()">
                    Register Cylinder
                </button>

                <div id="scan-in-message" class="message"></div>
            </div>
        </section>

        <!-- SCAN OUT -->
        <section id="screen-scan-out" class="screen">
            <div class="screen-content">
                <h2>📤 Scan OUT</h2>

                <input id="scan-out-code" class="barcode-input" placeholder="GLP Code">

                <button class="btn btn-info btn-lg" onclick="handleScanOutSearch()">
                    Search
                </button>

                <div id="scan-out-details" class="hidden">
                    <p id="scan-out-glp"></p>
                    <p id="scan-out-brand"></p>
                    <p id="scan-out-weight"></p>
                    <p id="scan-out-status"></p>

                    <button class="btn btn-danger" onclick="handleConfirmScanOut()">
                        Confirm OUT
                    </button>
                </div>

                <div id="scan-out-message" class="message"></div>
            </div>
        </section>

        <!-- INVENTORY -->
        <section id="screen-inventory" class="screen">
            <div class="screen-content">
                <h2>📊 Inventory</h2>

                <input id="inventory-search" class="search-input" placeholder="Search GLP..." onkeyup="filterInventory()">

                <button class="btn btn-secondary" onclick="refreshInventory()">
                    Refresh
                </button>

                <!-- STATS -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div id="stat-total">0</div>
                        <div>Total</div>
                    </div>

                    <div class="stat-card">
                        <div id="stat-full">0</div>
                        <div>Full</div>
                    </div>

                    <div class="stat-card">
                        <div id="stat-empty">0</div>
                        <div>Empty</div>
                    </div>

                    <div class="stat-card">
                        <div id="stat-out">0</div>
                        <div>Out</div>
                    </div>
                </div>

                <div id="inventory-list"></div>
            </div>
        </section>

    </main>
</div>

<!-- SCRIPTS (ORDER IS VERY IMPORTANT) -->
<script src="js/db.js"></script>
<script src="js/barcode.js"></script>
<script src="js/app.js"></script>

</body>
</html>
