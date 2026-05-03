const medForm = document.getElementById('medForm');
const logForm = document.getElementById('logForm');
const medList = document.getElementById('medList');
const logList = document.getElementById('logList');
const nextReminder = document.getElementById('nextReminder');

let medications = JSON.parse(localStorage.getItem('healthguardMeds') || '[]');
let healthLogs = JSON.parse(localStorage.getItem('healthguardLogs') || '[]');

function saveState() {
  localStorage.setItem('healthguardMeds', JSON.stringify(medications));
  localStorage.setItem('healthguardLogs', JSON.stringify(healthLogs));
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getNextDose(med) {
  const now = new Date();
  const [hour, minute] = med.startTime.split(':').map(Number);
  let next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  while (next <= now) {
    next.setHours(next.getHours() + Number(med.interval));
  }
  return next;
}

function renderMedications() {
  if (!medications.length) {
    medList.innerHTML = '<p>No medications added yet.</p>';
    nextReminder.textContent = 'No reminders yet. Add a medication to get started.';
    return;
  }

  const now = new Date();
  let upcoming = null;

  medList.innerHTML = '';
  medications.forEach((med, index) => {
    const nextDose = getNextDose(med);
    if (!upcoming || nextDose < upcoming.nextDose) {
      upcoming = { med, nextDose };
    }

    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="meta-row">
        <span><strong>${med.name}</strong></span>
        <span>${med.dose}</span>
      </div>
      <div class="item-meta">
        <span>Every ${med.interval} hour(s)</span>
        <span>Start ${med.startTime}</span>
        <span>Next dose ${formatTime(nextDose)}</span>
      </div>
      <div class="meta-action">
        <button class="btn-secondary" onclick="markTaken(${index})">Mark taken</button>
      </div>
    `;
    medList.appendChild(card);
  });

  if (upcoming) {
    const delta = Math.round((upcoming.nextDose - now) / 60000);
    nextReminder.textContent = `${upcoming.med.name} due at ${formatTime(upcoming.nextDose)} (${delta} min)`;
  }
}

function renderLogs() {
  if (!healthLogs.length) {
    logList.innerHTML = '<p>No health logs yet.</p>';
    return;
  }

  logList.innerHTML = '';
  const recent = healthLogs.slice(-5).reverse();
  recent.forEach((log) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="meta-row">
        <span><strong>${log.date}</strong></span>
        <span>${log.mood}</span>
      </div>
      <div class="item-meta">
        <span>Sleep: ${log.sleep} hrs</span>
        <span>Water: ${log.water} glasses</span>
      </div>
    `;
    logList.appendChild(card);
  });
}

function showReminderIfDue() {
  const now = new Date();
  medications.forEach((med) => {
    const nextDose = getNextDose(med);
    const diffMinutes = Math.abs((nextDose - now) / 60000);
    if (diffMinutes < 1) {
      alert(`Reminder: Take ${med.dose} of ${med.name} now.`);
    }
  });
}

window.markTaken = function (index) {
  const med = medications[index];
  const now = new Date();
  const nextDose = getNextDose(med);
  med.startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  medications[index] = med;
  saveState();
  renderMedications();
  alert(`Recorded as taken: ${med.name}. Next dose scheduled later.`);
};

medForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const newMed = {
    name: document.getElementById('medName').value.trim(),
    dose: document.getElementById('dose').value.trim(),
    interval: document.getElementById('interval').value,
    startTime: document.getElementById('startTime').value,
  };

  medications.push(newMed);
  saveState();
  medForm.reset();
  renderMedications();
});

logForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const newLog = {
    date: new Date().toLocaleDateString(),
    mood: document.getElementById('mood').value,
    sleep: document.getElementById('sleep').value,
    water: document.getElementById('water').value,
  };

  healthLogs.push(newLog);
  saveState();
  logForm.reset();
  renderLogs();
});

renderMedications();
renderLogs();
setInterval(() => {
  renderMedications();
}, 30000);
setInterval(showReminderIfDue, 60000);
