let catalogData = {};
let selectedClasses = new Set(['Class 9', 'Class 10', 'Class 11', 'Class 12']);
let selectedSubjects = new Set();
let isDownloading = false;
let statusInterval = null;

// DOM Elements
const classContainer = document.getElementById('class-container');
const subjectContainer = document.getElementById('subject-container');
const downloadPathInput = document.getElementById('download-path-input');
const btnStartDownload = document.getElementById('btn-start-download');
const btnStopDownload = document.getElementById('btn-stop-download');
const btnOpenFolder = document.getElementById('btn-open-folder');
const btnToggleAllClasses = document.getElementById('btn-toggle-all-classes');
const btnSelectAllSubjects = document.getElementById('btn-select-all-subjects');
const btnClearSubjects = document.getElementById('btn-clear-subjects');
const btnClearLogs = document.getElementById('btn-clear-logs');

// Dashboard Elements
const statTotal = document.getElementById('stat-total');
const statCompleted = document.getElementById('stat-completed');
const statSkipped = document.getElementById('stat-skipped');
const statFailed = document.getElementById('stat-failed');
const activeFileText = document.getElementById('active-file-text');
const progressPercent = document.getElementById('progress-percent');
const progressFill = document.getElementById('progress-fill');
const terminalBody = document.getElementById('terminal-body');
const systemStatus = document.getElementById('system-status');

// Initialize
async function init() {
  try {
    const res = await fetch('/api/catalog');
    const data = await res.json();
    catalogData = data.classes || {};
    
    if (data.default_path) {
      downloadPathInput.value = data.default_path;
    }

    renderClasses();
    collectAllSubjects();
    renderSubjects();
    
    // Check initial status
    checkStatus();
  } catch (err) {
    console.error('Failed to load catalog:', err);
    terminalBody.innerHTML += `<div class="log-entry log-error">Failed to connect to server API.</div>`;
  }
}

function collectAllSubjects() {
  selectedSubjects.clear();
  for (const cName in catalogData) {
    for (const sName in catalogData[cName]) {
      selectedSubjects.add(sName);
    }
  }
}

function renderClasses() {
  classContainer.innerHTML = '';
  const classNames = Object.keys(catalogData);

  classNames.forEach(cName => {
    const isSelected = selectedClasses.has(cName);
    
    // Total files for this class
    let totalFiles = 0;
    if (catalogData[cName]) {
      for (const s in catalogData[cName]) {
        totalFiles += catalogData[cName][s];
      }
    }

    const card = document.createElement('div');
    card.className = `class-card ${isSelected ? 'selected' : ''}`;
    card.innerHTML = `
      <span class="class-title">${cName}</span>
      <span class="class-badge">${totalFiles} Notes</span>
    `;

    card.addEventListener('click', () => {
      if (selectedClasses.has(cName)) {
        selectedClasses.delete(cName);
      } else {
        selectedClasses.add(cName);
      }
      renderClasses();
      renderSubjects();
      updateQueueEstimate();
    });

    classContainer.appendChild(card);
  });
}

function renderSubjects() {
  subjectContainer.innerHTML = '';
  
  // Collect all unique subjects across currently selected classes
  const subjectCounts = {};
  selectedClasses.forEach(cName => {
    if (catalogData[cName]) {
      for (const sName in catalogData[cName]) {
        subjectCounts[sName] = (subjectCounts[sName] || 0) + catalogData[cName][sName];
      }
    }
  });

  const subjectNames = Object.keys(subjectCounts).sort();

  if (subjectNames.length === 0) {
    subjectContainer.innerHTML = `<span style="color: var(--text-dim); font-size: 0.85rem;">Please select at least one class above.</span>`;
    return;
  }

  subjectNames.forEach(sName => {
    const isSelected = selectedSubjects.has(sName);
    const count = subjectCounts[sName];

    const chip = document.createElement('div');
    chip.className = `subject-chip ${isSelected ? 'selected' : ''}`;
    chip.innerHTML = `
      <span>${sName}</span>
      <span class="chip-count">${count}</span>
    `;

    chip.addEventListener('click', () => {
      if (selectedSubjects.has(sName)) {
        selectedSubjects.delete(sName);
      } else {
        selectedSubjects.add(sName);
      }
      renderSubjects();
      updateQueueEstimate();
    });

    subjectContainer.appendChild(chip);
  });
}

function updateQueueEstimate() {
  let estTotal = 0;
  selectedClasses.forEach(cName => {
    if (catalogData[cName]) {
      selectedSubjects.forEach(sName => {
        if (catalogData[cName][sName]) {
          estTotal += catalogData[cName][sName];
        }
      });
    }
  });
  if (!isDownloading) {
    statTotal.textContent = estTotal;
  }
}

// Button Events
btnToggleAllClasses.addEventListener('click', () => {
  const allCount = Object.keys(catalogData).length;
  if (selectedClasses.size === allCount) {
    selectedClasses.clear();
  } else {
    for (const c in catalogData) selectedClasses.add(c);
  }
  renderClasses();
  renderSubjects();
  updateQueueEstimate();
});

btnSelectAllSubjects.addEventListener('click', () => {
  for (const cName in catalogData) {
    for (const sName in catalogData[cName]) {
      selectedSubjects.add(sName);
    }
  }
  renderSubjects();
  updateQueueEstimate();
});

btnClearSubjects.addEventListener('click', () => {
  selectedSubjects.clear();
  renderSubjects();
  updateQueueEstimate();
});

btnClearLogs.addEventListener('click', () => {
  terminalBody.innerHTML = '';
});

btnOpenFolder.addEventListener('click', async () => {
  const path = downloadPathInput.value.trim();
  try {
    await fetch('/api/open-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: path })
    });
  } catch (err) {
    console.error('Failed to open folder:', err);
  }
});

btnStartDownload.addEventListener('click', async () => {
  if (selectedClasses.size === 0) {
    alert('Please select at least one Class.');
    return;
  }
  if (selectedSubjects.size === 0) {
    alert('Please select at least one Subject.');
    return;
  }

  const destination = downloadPathInput.value.trim();

  try {
    const res = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classes: Array.from(selectedClasses),
        subjects: Array.from(selectedSubjects),
        destination: destination
      })
    });

    if (res.ok) {
      isDownloading = true;
      btnStartDownload.classList.add('hidden');
      btnStopDownload.classList.remove('hidden');
      systemStatus.innerHTML = `<span class="pulse-dot" style="background: var(--accent-cyan); box-shadow: 0 0 10px var(--accent-cyan);"></span> Downloading...`;
      startPolling();
    } else {
      const data = await res.json();
      alert(`Error: ${data.error || 'Could not start download'}`);
    }
  } catch (err) {
    alert(`Connection error: ${err.message}`);
  }
});

btnStopDownload.addEventListener('click', async () => {
  try {
    await fetch('/api/stop', { method: 'POST' });
    btnStopDownload.textContent = 'Stopping...';
  } catch (err) {
    console.error('Failed to cancel download:', err);
  }
});

function startPolling() {
  if (statusInterval) clearInterval(statusInterval);
  statusInterval = setInterval(checkStatus, 700);
}

async function checkStatus() {
  try {
    const res = await fetch('/api/status');
    const state = await res.json();

    isDownloading = state.is_running;

    if (isDownloading) {
      btnStartDownload.classList.add('hidden');
      btnStopDownload.classList.remove('hidden');
      btnStopDownload.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        </svg>
        Cancel Download
      `;
      systemStatus.innerHTML = `<span class="pulse-dot" style="background: var(--accent-cyan); box-shadow: 0 0 10px var(--accent-cyan);"></span> Active`;
    } else {
      btnStartDownload.classList.remove('hidden');
      btnStopDownload.classList.add('hidden');
      systemStatus.innerHTML = `<span class="pulse-dot"></span> Ready`;
    }

    statTotal.textContent = state.total_files || '0';
    statCompleted.textContent = state.completed_files || '0';
    statSkipped.textContent = state.skipped_files || '0';
    statFailed.textContent = state.failed_files || '0';

    activeFileText.textContent = state.current_file || 'Waiting to start...';

    // Progress %
    const total = state.total_files || 1;
    const done = state.completed_files || 0;
    const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
    progressPercent.textContent = `${pct}%`;
    progressFill.style.width = `${pct}%`;

    // Render Logs
    if (state.logs && state.logs.length > 0) {
      terminalBody.innerHTML = state.logs.map(l => `
        <div class="log-entry log-${l.level}">
          <span class="log-time">[${l.time}]</span> ${escapeHtml(l.message)}
        </div>
      `).join('');
      terminalBody.scrollTop = terminalBody.scrollHeight;
    }

  } catch (err) {
    console.error('Status poll error:', err);
  }
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Start
init();
