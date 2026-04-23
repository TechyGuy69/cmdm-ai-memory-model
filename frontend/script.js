let STM = [];
let LTM = [];
let baselineMemory = [];
let logData = [];

let stats = { total: 0, deleted: 0 };

const decayFactorSTM = 0.85;
const threshold = 0.2;

const LTM_DECAY_DELAY = 20000;
const LTM_DECAY_FACTOR = 0.95;

// ----------- TEXT VECTOR FUNCTIONS -----------

// Convert text to vector
function textToVector(text) {
  const words = text.toLowerCase().split(" ");
  let freq = {};

  words.forEach(w => {
    freq[w] = (freq[w] || 0) + 1;
  });

  return freq;
}

// Cosine similarity
function cosineSimilarity(vec1, vec2) {
  let dot = 0, mag1 = 0, mag2 = 0;

  for (let key in vec1) {
    if (vec2[key]) dot += vec1[key] * vec2[key];
    mag1 += vec1[key] * vec1[key];
  }

  for (let key in vec2) {
    mag2 += vec2[key] * vec2[key];
  }

  return dot / (Math.sqrt(mag1) * Math.sqrt(mag2) || 1);
}

// ----------- ML API -----------
async function classify(text) {
  const res = await fetch("http://127.0.0.1:5000/predict", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ text })
  });

  const data = await res.json();
  return data.label;
}

// ----------- SEMANTIC REINFORCEMENT -----------

function reinforceSemantic(newMsg) {
  const newVec = textToVector(newMsg.text);

  LTM.forEach(msg => {
    const oldVec = textToVector(msg.text);
    const similarity = cosineSimilarity(newVec, oldVec);

    if (similarity > 0.4) {
      msg.score += similarity * 0.5;   // weighted boost
      msg.lastUsed = Date.now();
    }
  });
}

// ----------- SEND MESSAGE -----------

async function sendMessage() {
  const input = document.getElementById("input");
  const text = input.value.trim();
  if (!text) return;

  const label = await classify(text);

  const message = {
    text,
    score: 1.0,
    lastUsed: Date.now()
  };

  baselineMemory.push({ ...message });

  if (label === "LTM") {
    LTM.push(message);
  } else {
    STM.push(message);
  }

  // 🔥 Semantic reinforcement
  reinforceSemantic(message);

  stats.total++;
  input.value = "";
  render();
}

// ----------- DECAY SYSTEM -----------

setInterval(() => {

  STM = STM.filter(msg => {
    msg.score *= decayFactorSTM;

    // Promotion logic
    if (msg.score > 0.7 && msg.text.length > 20) {
      msg.lastUsed = Date.now();
      LTM.push(msg);
      return false;
    }

    if (msg.score < threshold) {
      stats.deleted++;
      return false;
    }

    return true;
  });

  // LTM conditional decay
  LTM.forEach(msg => {
    const timeDiff = Date.now() - msg.lastUsed;

    if (timeDiff > LTM_DECAY_DELAY) {
      msg.score *= LTM_DECAY_FACTOR;
    }
  });

  updateChart();
  updateStats();
  render();

}, 3000);

// ----------- DASHBOARD -----------

let chart;

function initChart() {
  const ctx = document.getElementById("chart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { label: "STM", data: [] },
        { label: "LTM", data: [] },
        { label: "Baseline", data: [] }
      ]
    }
  });
}

function updateChart() {
  const time = new Date().toLocaleTimeString();

  logData.push({
    time: time,
    stm: STM.length,
    ltm: LTM.length,
    baseline: baselineMemory.length
  });

  chart.data.labels.push(time);
  chart.data.datasets[0].data.push(STM.length);
  chart.data.datasets[1].data.push(LTM.length);
  chart.data.datasets[2].data.push(baselineMemory.length);

  chart.update();
}

function downloadData() {
  const blob = new Blob([JSON.stringify(logData, null, 2)], {
    type: "application/json"
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "memory_data.json";
  a.click();
}

function updateStats() {
  document.getElementById("stats").innerText =
    `Total: ${stats.total} | Deleted: ${stats.deleted} | STM: ${STM.length} | LTM: ${LTM.length}`;
}

// ----------- RENDER -----------

function render() {
  const chat = document.getElementById("chat");
  chat.innerHTML = "";

  chat.innerHTML += "<b>--- STM ---</b><br>";
  STM.forEach(m => {
    chat.innerHTML += `[STM] ${m.text} (${m.score.toFixed(2)})<br>`;
  });

  chat.innerHTML += "<br><b>--- LTM ---</b><br>";
  LTM.forEach(m => {
    chat.innerHTML += `[LTM] ${m.text} (${m.score.toFixed(2)})<br>`;
  });
}

initChart();