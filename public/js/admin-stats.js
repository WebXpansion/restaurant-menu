let pageChart;
let dishChart;
let dishArChart;


async function loadStats(period = "day") {
    const compare = document.getElementById("compareToggle").checked;
  
    if (!compare) {
      const res = await fetch(`/admin/stats/api/stats?period=${period}`

      );
      const data = await res.json();
  
      renderPageChart(data.pageViews);
      renderTopDishes(data.dishViews);
      populateDishSelect(data.dishViews);
  
      // ✅ TOTAUX ICI (BON ENDROIT)
      document.getElementById("totalPageViews").textContent =
        `· ${data.totals.pageViews} visites`;
  
      document.getElementById("totalDishViews").textContent =
        `· ${data.totals.dishViews} consultations`;
  
      return;
    }
  
    // MODE COMPARAISON
    const data = await loadComparison(period);
    renderComparisonChart(data.current, data.previous);
  }
  
  

/* ===== PAGE VIEWS CHART ===== */

function renderPageChart(items) {
  const ctx = document.getElementById("pageViewsChart");

  const labels = items.map(i => i.label);
  const values = items.map(i => i.count);

  if (pageChart) pageChart.destroy();

  pageChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Visites",
        data: values,
        tension: 0.35,
        fill: true,
        borderWidth: 2,
        pointRadius: 3
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function renderComparisonChart(current, previous) {
    const ctx = document.getElementById("pageViewsChart");
  
    const labels = current.map(d => d.label);
  
    if (pageChart) pageChart.destroy();
  
    pageChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Période actuelle",
            data: current.map(d => d.count),
            borderWidth: 2,
            tension: 0.35
          },
          {
            label: "Période précédente",
            data: previous.map(d => d.count),
            borderDash: [5,5],
            borderWidth: 2,
            tension: 0.35
          }
        ]
      },
      options: {
        scales: { y: { beginAtZero: true } }
      }
    });
  }
  

/* ===== TOP DISHES LIST ===== */

function renderTopDishes(dishes) {
  const container = document.getElementById("topDishes");
  container.innerHTML = "";

  if (!dishes.length) {
    container.innerHTML = "<p>Aucune donnée</p>";
    return;
  }

  dishes.forEach(d => {
    const row = document.createElement("div");
    row.className = "dish-row";

    row.innerHTML = `
      <strong>${d.title}</strong>
      <span>${d.count} 👁️</span>
    `;

    container.appendChild(row);
  });
}

/* ===== DISH SELECT ===== */

function populateDishSelect(dishes) {
    const select = document.getElementById("dishSelect");
    select.innerHTML = "";
  
    // option par défaut
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choisir un plat";
    placeholder.selected = true;
    placeholder.disabled = true;
    select.appendChild(placeholder);
  
    dishes.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.title;
      select.appendChild(opt);
    });
  }
  

/* ===== DISH CHART ===== */

async function loadDishStats(dishId) {
    if (!dishId) return;
  
    const period = document.getElementById("dishPeriodSelect").value;

    const res = await fetch(`/admin/stats/api/stats/dish/${dishId}?period=${period}`

    );
  
    const data = await res.json();
    renderDishChart(data);
  }
  

async function loadComparison(period) {
  const res = await fetch(`/admin/stats/api/stats/compare?period=${period}`

    );
    return await res.json();
  }
  

  function renderDishChart(data) {

    // 🔥 ici exactement
    document.getElementById("dishHint")?.remove();
  
    const ctx = document.getElementById("dishChart");
  
    const labels = data.map(d => d.label);
    const values = data.map(d => d.count);
  
    if (dishChart) dishChart.destroy();
  
    dishChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Consultations",
          data: values,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }



  async function loadDishArStats(dishId) {
    if (!dishId) return;
  
    const period = document.getElementById("dishPeriodSelect").value;
  
    const res = await fetch(`/admin/stats/api/stats/dish/${dishId}/ar?period=${period}`

    );
  
    const data = await res.json();
    renderDishArChart(data);
  }

  
  function renderDishArChart(data) {

    document.getElementById("dishHint")?.remove();
  
    const ctx = document.getElementById("dishArChart");
  
    const labels = data.map(d => d.label);
    const values = data.map(d => d.count);
  
    if (dishArChart) dishArChart.destroy();
  
    dishArChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "AR",
          data: values,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
  
  

/* ===== EVENTS ===== */

document
  .getElementById("periodSelect")
  .addEventListener("change", e => {
    loadStats(e.target.value);
  });
  
  document
  .getElementById("dishPeriodSelect")
  .addEventListener("change", () => {
    const dishId = document.getElementById("dishSelect").value;
    if (dishId) {
        loadDishStats(dishId);
        loadDishArStats(dishId);
        
    }
  });


  document
  .getElementById("compareToggle")
  .addEventListener("change", () => {
    loadStats(
      document.getElementById("periodSelect").value
    );
  });


  document
  .getElementById("dishSelect")
  .addEventListener("change", e => {
    const dishId = e.target.value;
    if (!dishId) return;

    loadDishStats(dishId);
    loadDishArStats(dishId); 
  });

  const qrCtx = document.getElementById("qrChart");

  if (qrCtx) {
  
    const qrPeriodSelect = document.getElementById("qrPeriodSelect");
    const totalQrScans = document.getElementById("totalQrScans");
  
    let qrChart;
  
    async function loadQrStats(period = "day") {
  
      const res = await fetch(`/admin/stats/qr?period=${period}`);
      const data = await res.json();
  
      const total = data.values.reduce((a, b) => a + b, 0);
      totalQrScans.textContent = `· ${total} scans`;
  
      if (qrChart) {
        qrChart.destroy();
      }
  
      qrChart = new Chart(qrCtx, {
        type: "line",
        data: {
          labels: data.labels,
          datasets: [{
            label: "Scans QR",
            data: data.values,
            tension: 0.3,
            fill: false
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } }
        }
      });
    }
  
    qrPeriodSelect.addEventListener("change", e => {
      loadQrStats(e.target.value);
    });
  
    loadQrStats();
  }
  

  loadStats();


