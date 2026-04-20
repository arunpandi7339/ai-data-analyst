const api = "http://127.0.0.1:5000";

let chart;
let currentChart = "product";

// ---------------- AUTO LOAD ON REFRESH ----------------
window.addEventListener("load", async () => {
    const uploaded = localStorage.getItem("fileUploaded");
    if (uploaded === "true") {
        await loadChart();
        currentChart = "product";
        const title = document.getElementById("chartTitle");
        if (title) title.innerText = "Product Sales 📦";
    }
});

// ---------------- UPLOAD ----------------
document.getElementById("uploadForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    document.getElementById("status").innerText = "Uploading...";

    const formData = new FormData(this);

    try {
        const res = await fetch(`${api}/upload`, {
            method: "POST",
            body: formData
        });

        const data = await res.text();
        document.getElementById("status").innerHTML = data;
        this.reset();

        // ✅ Fix: Save flag in localStorage so chart loads after refresh
        localStorage.setItem("fileUploaded", "true");

        await loadChart();
        currentChart = "product";

        const title = document.getElementById("chartTitle");
        if (title) title.innerText = "Product Sales 📦";

    } catch (error) {
        console.error("Upload error:", error);
        document.getElementById("status").innerText = "Upload Error ❌";
        // ✅ Fix: Clear flag if upload fails
        localStorage.removeItem("fileUploaded");
    }
});

// ---------------- ASK ----------------
async function askQuestion() {
    const q = document.getElementById("question").value.trim();

    if (!q) {
        document.getElementById("answer").innerText = "Please enter a question.";
        return;
    }

    try {
        const res = await fetch(`${api}/ask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: q })
        });

        if (!res.ok) throw new Error("Bad response from server");

        const data = await res.json();
        document.getElementById("answer").innerText = data.answer;

    } catch (error) {
        console.error("Ask error:", error);
        document.getElementById("answer").innerText = "Error getting answer ❌";
    }
}

// ---------------- PRODUCT CHART ----------------
async function loadChart() {
    const canvas = document.getElementById("myChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    try {
        const res = await fetch(`${api}/chart`);
        if (!res.ok) throw new Error("Bad response from server");

        const data = await res.json();

        if (chart) chart.destroy();

        chart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: "Product Sales",
                    data: data.values || [],
                    backgroundColor: "rgba(54, 162, 235, 0.5)"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

    } catch (error) {
        console.error("Chart load error:", error);
        // ✅ Fix: If backend lost data, clear flag
        localStorage.removeItem("fileUploaded");
    }
}

// ---------------- MONTHLY CHART ----------------
async function monthly() {
    const canvas = document.getElementById("myChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    try {
        const res = await fetch(`${api}/monthly`);
        if (!res.ok) throw new Error("Bad response from server");

        const data = await res.json();

        if (chart) chart.destroy();

        chart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: data.months || [],
                datasets: [{
                    label: "Monthly Sales",
                    data: data.sales || [],
                    backgroundColor: "rgba(54, 162, 235, 0.5)"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

    } catch (error) {
        console.error("Monthly chart load error:", error);
    }
}

// ---------------- TOGGLE ----------------
function toggleChart() {
    const title = document.getElementById("chartTitle");

    if (currentChart === "product") {
        monthly();
        currentChart = "monthly";
        if (title) title.innerText = "Monthly Sales 📅";
    } else {
        loadChart();
        currentChart = "product";
        if (title) title.innerText = "Product Sales 📦";
    }
}