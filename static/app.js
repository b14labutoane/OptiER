// Frontend JavaScript for OptiER - Emergency Room Patient Management System
// Handles UI interactions and API communication for patient queue management

const severityLabels = {
    1: 'Critical', 2: 'Urgent', 3: 'Serious', 4: 'Minor', 5: 'Minimal'
};

/**
 * Add a new patient to the emergency room queue
 * Calls POST /api/patient endpoint with patient details
 */
function addPatient() {
    const name = document.getElementById('name').value.trim();
    const cnp = document.getElementById('cnp').value.trim();
    const severity = document.getElementById('severity').value;

    if (!name || !cnp) {
        alert('Please fill in name and CNP');
        return;
    }

    fetch('/api/patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, cnp, severity })
    })
    .then(r => r.json())
    .then(() => {
        document.getElementById('name').value = '';
        document.getElementById('cnp').value = '';
        addLog(`Added patient: ${name} (severity ${severity})`);
        refreshAll();
    });
}

/**
 * Admit the next patient from a specified room
 * Calls POST /api/admit/{roomId} endpoint to move patient to treatment
 */
function admitNext(roomId) {
    fetch(`/api/admit/${roomId}`, { method: 'POST' })
    .then(r => {
        if (r.status === 400) {
            alert('Room is empty');
            return null;
        }
        return r.json();
    })
    .then(data => {
        if (data) {
            addLog(`Admitted from Room ${roomId}: ${data.patient}`, 'admit');
            refreshAll();
        }
    });
}

/**
 * Activate mass casualty emergency mode to redistribute patients across rooms
 * Calls POST /api/mass-casualty endpoint to merge and redistribute all queues
 */
function massCasualty() {
    if (!confirm('Activate Mass Casualty Mode? All queues will be merged and redistributed.')) return;

    fetch('/api/mass-casualty', { method: 'POST' })
    .then(r => r.json())
    .then(data => {
        addLog(`MASS CASUALTY: Redistributed ${data.redistributed} patients`, 'mass-casualty');
        refreshAll();
    });
}

/**
 * Switch between different UI tabs (queue, rooms, statistics)
 * Updates active tab states and shows corresponding content
 */
function switchTab(name) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${name}"]`).classList.add('active');
    document.getElementById(`tab-${name}`).classList.add('active');
}

/**
 * Toggle section visibility/collapse state
 * Used for expandable sections in the UI
 */
function toggleSection(label) {
    label.parentElement.classList.toggle('collapsed');
}

/**
 * Search for a patient by CNP (Unique National Identification Number)
 * Calls GET /api/search/{cnp} endpoint and displays results
 */
function searchPatient() {
    const cnp = document.getElementById('search-cnp').value.trim();
    const resultDiv = document.getElementById('search-result');

    if (!cnp) {
        resultDiv.innerHTML = '<div class="sr-error">Please enter a CNP</div>';
        resultDiv.classList.add('visible');
        return;
    }

    fetch(`/api/search/${cnp}`)
    .then(r => {
        if (r.status === 404) return null;
        return r.json();
    })
    .then(data => {
        if (!data) {
            resultDiv.innerHTML = '<div class="sr-error">Patient not found</div>';
            resultDiv.classList.add('visible');
            return;
        }

        resultDiv.innerHTML = `
            <div class="sr-name">${data.name}</div>
            <div class="sr-row"><span>CNP</span><span>${data.cnp}</span></div>
            <div class="sr-row"><span>Severity</span><span class="sev-badge sev-${data.severity}">${data.severity} ${severityLabels[data.severity]}</span></div>
            <div class="sr-row"><span>Room</span><span>${data.room}</span></div>
            <div class="sr-row"><span>Priority</span><span>${data.priority}</span></div>
            <div class="sr-row"><span>Arrived</span><span>${data.arrival}</span></div>
        `;
        resultDiv.classList.add('visible');
        addLog(`Searched patient: ${data.name} (CNP: ${cnp})`);
    });
}

/**
 * Refresh all ER data including waiting counts, treatment statistics, and patient queues
 * Calls GET /api/status endpoint to get current system state
 */
function refreshAll() {
    fetch('/api/status').then(r => r.json()).then(data => {
        document.getElementById('stat-waiting').textContent = data.total_waiting;
        document.getElementById('stat-treated').textContent = data.total_treated;
        document.getElementById('stat-r1').textContent = data.room_sizes['1'] || 0;
        document.getElementById('stat-r2').textContent = data.room_sizes['2'] || 0;
        document.getElementById('stat-r3').textContent = data.room_sizes['3'] || 0;
        renderPatients(data.patients);
    });
}

/**
 * Render patient data in the queue table from parsed patient information
 * Parses patient strings with severity and room data for display
 */
function renderPatients(patients) {
    const tbody = document.getElementById('patient-table');
    const emptyMsg = document.getElementById('queue-empty');
    tbody.innerHTML = '';

    if (Object.keys(patients).length === 0) {
        emptyMsg.style.display = 'block';
        return;
    }
    emptyMsg.style.display = 'none';

    for (const [cnp, info] of Object.entries(patients)) {
        const match = info.match(/\(([^)]+)\)/);
        const parts = match ? match[1].split(', ') : [];
        let name = info.split(' (')[0];
        let sev = '3';
        let room = '?';

        for (const part of parts) {
            if (part.startsWith('sev:')) sev = part.split(':')[1];
            if (part.startsWith('room:')) room = part.split(':')[1];
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cnp}</td>
            <td>${name}</td>
            <td><span class="sev-badge sev-${sev}">${sev} ${severityLabels[sev]}</span></td>
            <td>${room}</td>
        `;
        tbody.appendChild(tr);
    }
}

/**
 * Add log entry to activity log with timestamp and optional type styling
 * Creates new log div with current time and message
 */
function addLog(message, type = '') {
    const container = document.getElementById('activity-log');
    const div = document.createElement('div');
    div.className = `log-line ${type}`;
    const time = new Date().toLocaleTimeString();
    div.innerHTML = `<span class="log-time">${time}</span><span>${message}</span>`;
    container.insertBefore(div, container.firstChild);
}

refreshAll();
setInterval(refreshAll, 3000);
