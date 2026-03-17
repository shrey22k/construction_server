// ----------- CONFIG (AUTO SWITCH LOCAL / DOCKER) -----------

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://127.0.0.1:5000"
    : "http://backend:5000";


// ----------- MAIN FUNCTION -----------

async function runPlanner() {

  const goal = document.getElementById("goal").value.trim();
  if (!goal) return alert("Enter goal");

  document.getElementById("thinking").style.display = "block";
  animateProgress();

  try {
    const res = await fetch(`${API_BASE}/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal })
    });

    const data = await res.json();

    document.getElementById("thinking").style.display = "none";
    document.getElementById("progressBar").style.width = "100%";

    document.getElementById("goalOut").textContent = data.goal;

    document.getElementById("schedule").innerHTML =
      data.optimized_schedule
        .map((t, i) => `<li>Step ${i + 1}: ${t}</li>`)
        .join("");

    // ----------- RISK FORMAT -----------

    const riskElem = document.getElementById("risk");

    if (data.risk) {
      const parts = data.risk
        .split('•')
        .map(p => p.trim())
        .filter(p => p);

      riskElem.innerHTML = parts.length > 1
        ? '<ul>' + parts.map(p => `<li>${p}</li>`).join('') + '</ul>'
        : data.risk;
    } else {
      riskElem.textContent = '';
    }

    // ----------- SEVERITY -----------

    const sev = document.getElementById("severity");
    sev.textContent = "Severity: " + data.severity;
    sev.className = "severity " + data.severity;

    // ----------- GANTT -----------

    document.getElementById("gantt").src =
      `${API_BASE}/gantt.png?${Date.now()}`;

    // ----------- UI ADJUSTMENT -----------

    const row = document.querySelector('.flex-row');
    if (row) row.classList.add('stacked');

  } catch (error) {
    console.error(error);
    alert("Error connecting to backend");
  }
}


// ----------- PROGRESS BAR -----------

function animateProgress() {
  let bar = document.getElementById("progressBar");

  bar.style.width = "10%";
  setTimeout(() => bar.style.width = "40%", 400);
  setTimeout(() => bar.style.width = "70%", 800);
}


// ----------- THEME TOGGLE -----------

function toggleTheme() {
  const btn = document.getElementById("themeBtn");

  const isDark = document.body.classList.toggle("dark");

  btn.textContent = isDark
    ? "🌗 Dark Mode: On"
    : "🌗 Dark Mode: Off";
}


// ----------- VOICE INPUT -----------

function startVoice() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

  recognition.lang = "en-US";
  recognition.start();

  recognition.onresult = e => {
    document.getElementById("goal").value =
      e.results[0][0].transcript;
  };
}


// ----------- EXPORT PDF -----------

function exportPDF() {
  window.print();
}


// ----------- ENTER KEY SUPPORT -----------

document.getElementById("goal").addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    runPlanner();
  }
});