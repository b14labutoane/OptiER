const severityLabels = {
    1: 'Critical', 2: 'Urgent', 3: 'Serious', 4: 'Minor', 5: 'Minimal'
};

const SVG_NS = 'http://www.w3.org/2000/svg';

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

function massCasualty() {
    if (!confirm('Activate Mass Casualty Mode? All queues will be merged and redistributed.')) return;

    fetch('/api/mass-casualty', { method: 'POST' })
    .then(r => r.json())
    .then(data => {
        addLog(`MASS CASUALTY: Redistributed ${data.redistributed} patients`, 'mass-casualty');
        refreshAll();
    });
}

function switchTab(name) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${name}"]`).classList.add('active');
    document.getElementById(`tab-${name}`).classList.add('active');
}

function toggleSection(label) {
    label.parentElement.classList.toggle('collapsed');
}

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

function refreshAll() {
    fetch('/api/status').then(r => r.json()).then(data => {
        document.getElementById('stat-waiting').textContent = data.total_waiting;
        document.getElementById('stat-treated').textContent = data.total_treated;
        document.getElementById('stat-r1').textContent = data.room_sizes['1'] || 0;
        document.getElementById('stat-r2').textContent = data.room_sizes['2'] || 0;
        document.getElementById('stat-r3').textContent = data.room_sizes['3'] || 0;
        renderPatients(data.patients);
    });

    fetch('/api/rbt').then(r => r.json()).then(data => {
        drawRBT(data);
    });

    fetch('/api/heap/1').then(r => r.json()).then(h1 => {
        fetch('/api/heap/2').then(r => r.json()).then(h2 => {
            fetch('/api/heap/3').then(r => r.json()).then(h3 => {
                drawHeaps([h1, h2, h3]);
            });
        });
    });
}

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

function addLog(message, type = '') {
    const container = document.getElementById('activity-log');
    const div = document.createElement('div');
    div.className = `log-line ${type}`;
    const time = new Date().toLocaleTimeString();
    div.innerHTML = `<span class="log-time">${time}</span><span>${message}</span>`;
    container.insertBefore(div, container.firstChild);
}

function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
        el.setAttribute(k, v);
    }
    return el;
}

function countNodes(node) {
    if (!node) return 0;
    return 1 + countNodes(node.left) + countNodes(node.right);
}

function treeDepth(node) {
    if (!node) return 0;
    return 1 + Math.max(treeDepth(node.left), treeDepth(node.right));
}

function drawRBT(data) {
    const svg = document.getElementById('rbt-svg');
    const emptyMsg = document.getElementById('rbt-empty');
    svg.innerHTML = '';

    if (!data) {
        emptyMsg.style.display = 'block';
        return;
    }
    emptyMsg.style.display = 'none';

    const total = countNodes(data);
    const depth = treeDepth(data);
    const nodeSpacing = 55;
    const levelHeight = 70;
    const padding = 30;
    const width = Math.max(svg.parentElement.clientWidth - 40, total * nodeSpacing + padding * 2);
    const height = depth * levelHeight + padding * 2 + 20;
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);

    let position = 0;
    function assignPositions(node, level) {
        if (!node) return;
        assignPositions(node.left, level + 1);
        node._x = padding + position * nodeSpacing;
        node._y = padding + level * levelHeight;
        position++;
        assignPositions(node.right, level + 1);
    }
    assignPositions(data, 0);

    drawRBNodes(svg, data);
}

function drawRBNodes(svg, node) {
    if (!node) return;

    drawRBNodes(svg, node.left);
    drawRBNodes(svg, node.right);

    if (node.left) {
        svg.appendChild(svgEl('line', {
            x1: node._x, y1: node._y + 18, x2: node.left._x, y2: node.left._y - 18,
            stroke: '#d2d2d7', 'stroke-width': '1.5'
        }));
    }

    if (node.right) {
        svg.appendChild(svgEl('line', {
            x1: node._x, y1: node._y + 18, x2: node.right._x, y2: node.right._y - 18,
            stroke: '#d2d2d7', 'stroke-width': '1.5'
        }));
    }

    const isRed = node.color === 'red';
    const fill = isRed ? '#ff3b30' : '#1d1d1f';
    const strokeColor = isRed ? '#ff6961' : '#48484a';

    svg.appendChild(svgEl('circle', {
        cx: node._x, cy: node._y, r: 18,
        fill: fill, stroke: strokeColor, 'stroke-width': '2'
    }));

    svg.appendChild(svgEl('text', {
        x: node._x, y: node._y + 4,
        'text-anchor': 'middle',
        fill: '#fff', 'font-size': '10', 'font-weight': '600',
        'font-family': 'Inter, sans-serif'
    })).textContent = node.key;

    const label = node.name || '';
    if (label && label !== String(node.key)) {
        svg.appendChild(svgEl('text', {
            x: node._x, y: node._y + 32,
            'text-anchor': 'middle',
            fill: '#86868b', 'font-size': '9', 'font-family': 'Inter, sans-serif'
        })).textContent = label.length > 8 ? label.substring(0, 7) + '…' : label;
    }
}

function drawHeaps(heaps) {
    const svg = document.getElementById('heap-svg');
    const emptyMsg = document.getElementById('heap-empty');
    svg.innerHTML = '';

    const hasAny = heaps.some(h => h && h.length > 0);
    if (!hasAny) {
        emptyMsg.style.display = 'block';
        return;
    }
    emptyMsg.style.display = 'none';

    const roomColors = ['#0071e3', '#34c759', '#ff9500'];
    const nodeSpacing = 45;
    const levelHeight = 65;
    const padding = 30;
    const roomGap = 60;

    let totalNodes = 0;
    let totalDepth = 0;
    for (const trees of heaps) {
        if (!trees) continue;
        for (const t of trees) {
            totalNodes += countHeapNodes(t);
            totalDepth = Math.max(totalDepth, heapDepth(t));
        }
    }

    const width = Math.max(svg.parentElement.clientWidth - 40, totalNodes * nodeSpacing + roomGap * 3 + padding * 2);
    const height = totalDepth * levelHeight + padding * 2 + 30;
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);

    let globalX = padding;

    for (let i = 0; i < heaps.length; i++) {
        const trees = heaps[i];
        if (!trees || trees.length === 0) continue;

        const roomLabel = svgEl('text', {
            x: globalX, y: 18,
            fill: roomColors[i], 'font-size': '12', 'font-weight': '600',
            'font-family': 'Inter, sans-serif'
        });
        roomLabel.textContent = `Room ${i + 1}`;
        svg.appendChild(roomLabel);

        for (const tree of trees) {
            let pos = 0;
            const nodeCount = countHeapNodes(tree);
            function assignHeapPos(n, level) {
                if (!n) return;
                for (const c of (n.children || [])) {
                    assignHeapPos(c, level + 1);
                }
                n._x = globalX + pos * nodeSpacing;
                n._y = padding + level * levelHeight;
                pos++;
            }
            assignHeapPos(tree, 0);
            drawHeapNodes(svg, tree, roomColors[i]);
            globalX += nodeCount * nodeSpacing + 15;
        }

        globalX += roomGap - 15;
    }
}

function countHeapNodes(node) {
    if (!node) return 0;
    let count = 1;
    for (const c of (node.children || [])) {
        count += countHeapNodes(c);
    }
    return count;
}

function heapDepth(node) {
    if (!node) return 0;
    let max = 0;
    for (const c of (node.children || [])) {
        max = Math.max(max, heapDepth(c));
    }
    return 1 + max;
}

function drawHeapNodes(svg, node, color) {
    if (!node) return;

    for (const child of (node.children || [])) {
        svg.appendChild(svgEl('line', {
            x1: node._x, y1: node._y + 18, x2: child._x, y2: child._y - 18,
            stroke: '#d2d2d7', 'stroke-width': '1.5'
        }));
        drawHeapNodes(svg, child, color);
    }

    svg.appendChild(svgEl('circle', {
        cx: node._x, cy: node._y, r: 18,
        fill: '#fff', stroke: color, 'stroke-width': '2.5'
    }));

    svg.appendChild(svgEl('text', {
        x: node._x, y: node._y + 4,
        'text-anchor': 'middle',
        fill: '#1d1d1f', 'font-size': '10', 'font-weight': '600',
        'font-family': 'Inter, sans-serif'
    })).textContent = node.key;

    const label = node.name || '';
    if (label && label !== String(node.key)) {
        svg.appendChild(svgEl('text', {
            x: node._x, y: node._y + 32,
            'text-anchor': 'middle',
            fill: '#86868b', 'font-size': '9', 'font-family': 'Inter, sans-serif'
        })).textContent = label.length > 8 ? label.substring(0, 7) + '…' : label;
    }
}

refreshAll();
setInterval(refreshAll, 3000);
