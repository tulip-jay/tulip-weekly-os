
function checkPassword() {
  const val = document.getElementById('lock-input').value;
  if (val === LOCK_PASSWORD) {
    document.getElementById('lock-screen').classList.add('hidden');
    sessionStorage.setItem('tulip-unlocked', '1');
  } else {
    document.getElementById('lock-error').textContent = 'Incorrect password';
    document.getElementById('lock-input').value = '';
  }
}

/* ══ DATA ════════════════════════════════════════════════════════ */
const SECTIONS = [
  { name:'🎉 Segue',      shortName:'Segue',      desc:'Share one piece of good news — personal or professional.',            lead:'Everyone',  mins: 2 },
  { name:'📊 Scorecard',  shortName:'Scorecard',  desc:'Call your KPIs — on track or off track. No debate.',                 lead:'Everyone',  mins:10 },
  { name:'🪨 Rocks',      shortName:'Rocks',      desc:'One sentence per rock. On track / off track / done.',                 lead:'Owners',    mins:10 },
  { name:'🎯 Goals',      shortName:'Goals',      desc:'Quick round — on track or not. One sentence each.',                   lead:'Everyone',  mins:10 },
  { name:'💬 Discussion', shortName:'Discussion', desc:'Top 3 only. Identify → Discuss → Solve.',                             lead:'Everyone',  mins:25 },
  { name:'✅ To-Dos',     shortName:'To-Dos',     desc:'Every commitment = owner + due date. Charlotte captures live.',       lead:'Charlotte', mins: 5 },
  { name:'⭐ Rating',     shortName:'Rating',     desc:'Rate this week\'s meeting 1–5 for each team member.',                lead:'Everyone',  mins: 2 },
];
let TOTAL_MINS = 64;

const TEAM = ['Bitty','Charlotte','Jay','Lori','Mike','Vendela'];
let ratings = {};

let rocks = [
  { id:0, title:'Reduce shipping / fulfillment cost structure', owner:'Jay + Charlotte', status:'off-track', lever:'↓ Cost',        done:'Cost/order below Q1 2025 baseline. Root cause complete. Fix actioned by June 30.', sheetRow:8 },
  { id:1, title:'Baggy site redesign live',                     owner:'Mike + Bitty',    status:'on-track',  lever:'↑ Conv.',       done:'Site live + A/B test running before June 30. Conversion baseline established.',     sheetRow:9 },
  { id:2, title:'Rebuild email flows — cart · welcome · post-purchase', owner:'Mike',   status:'on-track',  lever:'↑ Revenue',     done:'All 3 flows live. Abandonment + welcome + Swap Your Shade.',                        sheetRow:10 },
  { id:3, title:'Charlotte autonomous on ops by July 1',        owner:'Jay + Charlotte', status:'on-track',  lever:'↓ Cost',        done:'Charlotte operating independently. Jay\'s task list complete by May 9.',           sheetRow:11 },
  { id:4, title:'Organic as measurable revenue channel',        owner:'Vendela',         status:'on-track',  lever:'↑ Rev / ↓ CAC', done:'Organic reach hits agreed target. 8+ UGC/month feeding paid.',                    sheetRow:12 },
  { id:5, title:'Lori\'s personal rock',                        owner:'Lori',            status:'on-track',  lever:'TBD',           done:'Definition to be set.',                                                             sheetRow:13 },
];

let goals = [
  { person:'Jay',      rocks:'1, 4', status:'on-track',
    items:['Charlotte fully autonomous — unowned-task list by May 9 · handoff June 30','Reduce shipping/fulfillment cost — root cause + fix actioned by June 30'] },
  { person:'Mike',     rocks:'2, 3', status:'on-track',
    items:['Partner w/ Baggy on site redesign — conversion improvement measurable by May 31','Rebuild email flows — cart + welcome + post-purchase by June 30','Paid media — nCAC <$35 · MER ≥5, targeting 6+'] },
  { person:'Bitty',    rocks:'2',    status:'on-track',
    items:['Partner w/ Baggy on site redesign — conversion improvement measurable by Q3','Foundation for 2 photo shoots by EOY — brief + gap list complete by June 30'] },
  { person:'Vendela',  rocks:'5',    status:'on-track',
    items:['Organic reach — define target w/ Mike · track weekly','8+ influencer UGC/month feeding paid creative (UGC → creative → MER chain)','Link-in-bio CTR — track weekly'] },
  { person:'Charlotte',rocks:'1, 4', status:'on-track',
    items:['Zero out-of-stock on finished goods (A-class) — tracked weekly','Identify cost savings from unit economics WITH $ estimate by June 30'] },
  { person:'Lori',     rocks:'6',    status:'on-track',
    items:['⚠ Personal rock not yet set — required before this meeting'], warn:true },
];

let issues = [
  { id:0, title:'Baggy site redesign — no start date. Best zero-COGS conversion fix available.', owner:'Mike + Bitty', priority:'high',   notes:'Contract received and is with Lori for execution. Baggy has committed to starting the work within a week.', completed:false },
  { id:1, title:'Photo shoot planning (budget needed)',                                           owner:'Bitty',        priority:'medium', notes:'Meeting with Mike to set up priorities based on calendar?',                                                   completed:false },
  { id:2, title:'New content assets tracking',                                                   owner:'Bitty',        priority:'medium', notes:"Bitty to work with Claude and look at team meeting notes to come up with a tracking plan for next week's meeting.", completed:false },
  { id:3, title:'Back-end owner',                                                                owner:'Charlotte',    priority:'medium', notes:'', completed:false },
  { id:4, title:'CX management owner',                                                           owner:'Charlotte',    priority:'medium', notes:'', completed:false },
  { id:5, title:'Monthly reporting from team',                                                   owner:'Jay',          priority:'medium', notes:'', completed:false },
  { id:6, title:'Bloomers back in stock — social + email plan needed',                           owner:'Jay / Lori',   priority:'high',   notes:'', completed:false },
  { id:7, title:'Where are we tracking 15% net margin?',                                         owner:'Jay',          priority:'medium', notes:'', completed:false },
];

let todos = [
  { id:0, text:'Physical count adjustments effecting GPM', owner:'', due:'', status:'not-started' },
];

/* ── Cached DOM refs (set in init) ── */
let elTimerDisplay, elTimerProg, elMeetingElapsed, elMeetingBar, elSyncDot, elSyncLabel, elCaptureModal, elCaptureFab;

/* ══ TIMER ═══════════════════════════════════════════════════════ */
let currentIdx    = 0;
let timerRunning  = false;
let timerInterval = null;
let totalElapsed  = 0;
let meetingTick   = null;
let sectionDone   = new Array(SECTIONS.length).fill(false);
let sectionTimers = SECTIONS.map(s => s.mins * 60); // per-section saved time
let timerSecs     = sectionTimers[0];

function renderTimer() {
  const abs  = Math.abs(timerSecs);
  const sign = timerSecs < 0 ? '-' : '';
  const m    = Math.floor(abs / 60);
  const s    = abs % 60;
  elTimerDisplay.textContent = `${sign}${m}:${s.toString().padStart(2,'0')}`;
  elTimerDisplay.classList.remove('warning','over');
  elTimerProg.classList.remove('warning','over');
  const pct = Math.min(100, Math.max(0, timerSecs / (SECTIONS[currentIdx].mins * 60) * 100));
  if (timerSecs < 0) {
    elTimerDisplay.classList.add('over'); elTimerProg.classList.add('over'); elTimerProg.style.width = '100%';
  } else if (timerSecs <= 120) {
    elTimerDisplay.classList.add('warning'); elTimerProg.classList.add('warning'); elTimerProg.style.width = pct + '%';
  } else {
    elTimerProg.style.width = pct + '%';
  }
}

function toggleTimer() {
  timerRunning ? stopTimer() : startTimer();
}

function startTimer() {
  if (timerRunning) return;
  if (!meetingTick) meetingTick = setInterval(tickMeeting, 1000);
  timerRunning = true;
  timerInterval = setInterval(() => { timerSecs--; sectionTimers[currentIdx] = timerSecs; renderTimer(); }, 1000);
}

function stopTimer() {
  timerRunning = false;
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function tickMeeting() {
  totalElapsed++;
  const m = Math.floor(totalElapsed/60), s = totalElapsed%60;
  elMeetingElapsed.textContent = `${m}:${s.toString().padStart(2,'0')}`;
  elMeetingBar.style.width = Math.min(100, totalElapsed/(TOTAL_MINS*60)*100) + '%';
}

function nextSection() {
  stopTimer();
  sectionDone[currentIdx] = true;
  if (currentIdx < SECTIONS.length - 1) {
    goToSection(currentIdx + 1);
  } else {
    goToSection(currentIdx);
    if (meetingTick) { clearInterval(meetingTick); meetingTick = null; }
    document.getElementById('done-overlay').classList.add('show');
  }
}

/* ══ NAVIGATION ══════════════════════════════════════════════════ */
function init() {
  elTimerDisplay  = document.getElementById('timer-display');
  elTimerProg     = document.getElementById('timer-prog');
  elMeetingElapsed= document.getElementById('total-elapsed');
  elMeetingBar    = document.getElementById('meeting-bar');
  elSyncDot       = document.getElementById('sync-dot');
  elSyncLabel     = document.getElementById('sync-label');
  elCaptureModal  = document.getElementById('capture-modal');
  elCaptureFab    = document.getElementById('capture-fab');

  const cachedMins = localStorage.getItem('tulip-section-mins');
  if (cachedMins) {
    try {
      JSON.parse(cachedMins).forEach((m, i) => {
        if (SECTIONS[i] && !isNaN(m) && m > 0) {
          SECTIONS[i].mins = m;
          sectionTimers[i] = m * 60;
        }
      });
      TOTAL_MINS = SECTIONS.reduce((sum, s) => sum + s.mins, 0);
      timerSecs  = sectionTimers[0]; // keep timerSecs in sync after cache restore
    } catch(e) { console.warn('tulip: failed to restore section timings', e); }
  }

  buildNav();
  renderSegue();
  renderRating();
  renderRocks();
  renderGoals();
  renderIssues();
  renderTodos();
  buildSparklines();
  hideEmptyWeekCols();
  normalizeLatestCells();
  markLatestWeekHead();
  showHomepage();
  if (SYNC_URL) {
    if (elSyncLabel) elSyncLabel.textContent = 'Connecting…';
    loadConfig();
    loadFromSheets();
    loadRocks();
    loadGoals();
    loadIssues();
    loadTodos();
    setInterval(loadFromSheets, 60000); // only scorecard refreshes; issues/todos load once
  }
}

function buildNav() {
  const nav = document.getElementById('agenda-nav');
  nav.innerHTML = '';
  SECTIONS.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.className = 'section-btn';
    btn.id = 'nav-btn-' + i;
    btn.onclick = () => goToSection(i);
    btn.innerHTML = `
      <div class="sec-num">${i+1}</div>
      <div class="sec-info">
        <div class="sec-name">${s.shortName}</div>
        <div class="sec-lead">${s.lead}</div>
      </div>
      <div class="sec-mins">${s.mins}m</div>`;
    nav.appendChild(btn);
  });
}

function goToSection(idx) {
  const meetingInProgress = meetingTick !== null;
  stopTimer();
  document.getElementById('done-overlay').classList.remove('show');
  // Dismiss homepage overlay
  document.getElementById('panel-home').classList.remove('active');
  sectionTimers[currentIdx] = timerSecs; // save current section's remaining time
  currentIdx = idx;
  timerSecs  = sectionTimers[idx];       // restore target section's time

  document.querySelectorAll('.panel').forEach((p,i) => p.classList.toggle('active', i===idx));
  document.getElementById('curr-eyebrow').textContent = `Section ${idx+1} of ${SECTIONS.length}`;
  document.getElementById('curr-name').textContent    = SECTIONS[idx].name;
  document.getElementById('curr-desc').textContent    = SECTIONS[idx].desc;

  document.querySelectorAll('.section-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i===idx);
    btn.classList.toggle('done', sectionDone[i] && i!==idx);
    btn.querySelector('.sec-num').textContent = (sectionDone[i] && i!==idx) ? '✓' : (i+1);
  });

  // On the Rating section (last), hide the timer block — no countdown needed there
  const isRating = idx === SECTIONS.length - 1;
  const timerBlock = document.querySelector('.timer-block');
  if (timerBlock) timerBlock.style.display = isRating ? 'none' : '';

  renderTimer();
  // Auto-continue timer when navigating mid-meeting
  if (meetingInProgress) startTimer();
}

/* ══ HOMEPAGE ════════════════════════════════════════════════════ */
function showHomepage() {
  stopTimer();
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const hp = document.getElementById('panel-home');
  if (hp) hp.classList.add('active');
  buildHomepage();
}

function buildHomepage() {
  // Use the meeting date from the sidebar brand-sub ("Weekly All Hands · May 12, 2026")
  const brandSub = document.querySelector('.brand-sub');
  let dateStr = '';
  if (brandSub) {
    const parts = brandSub.textContent.split('·');
    if (parts.length > 1) dateStr = parts.slice(1).join('·').trim();
  }
  const dateEl = document.getElementById('home-date');
  if (dateEl) dateEl.textContent = dateStr || new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
}

function startMeeting() {
  goToSection(0);
  startTimer(); // auto-start on meeting begin
}

/* ══ SEGUE ═══════════════════════════════════════════════════════ */
function renderSegue() {
  const c = document.getElementById('segue-container');
  if (!c) return;
  c.innerHTML = `
    <div class="segue-prompt">
      <div class="segue-icon">🎉</div>
      <div class="segue-heading">Good News Round</div>
      <div class="segue-sub">Anyone who wants to share — share one piece of good news. Personal or professional, anything goes.</div>
    </div>`;
}

/* ══ RATING ══════════════════════════════════════════════════════ */
function renderRating() {
  const c = document.getElementById('rating-container');
  if (!c) return;
  c.innerHTML = `
    <div class="rating-intro">
      <p>Rate this week's meeting 1–5 for each team member<br>
         <span style="font-size:12.5px;color:var(--text-faint)">1 = needs work &nbsp;·&nbsp; 5 = excellent</span>
      </p>
    </div>
    <div class="rating-grid">
      ${TEAM.map(name => `
        <div class="rating-row">
          <div class="rating-name">${name}</div>
          <div class="star-row" id="stars-${name}" onmouseleave="unhoverRating('${name}')">
            ${[1,2,3,4,5].map(n =>
              `<button class="star"
                 onclick="setRating('${name}',${n})"
                 onmouseenter="hoverRating('${name}',${n})">★</button>`
            ).join('')}
          </div>
          <div class="rating-val" id="rval-${name}">—</div>
        </div>`).join('')}
    </div>
    <div class="rating-footer">
      <button class="btn btn-primary" onclick="logMeeting()">Log Meeting →</button>
    </div>`;
}

function setRating(name, n) {
  ratings[name] = n;
  const row = document.getElementById('stars-' + name);
  if (row) row.querySelectorAll('.star').forEach((btn, i) => {
    btn.classList.toggle('active', i < n);
    btn.classList.remove('hovered');
  });
  const val = document.getElementById('rval-' + name);
  if (val) val.textContent = n + '/5';
}

function hoverRating(name, n) {
  const row = document.getElementById('stars-' + name);
  if (!row) return;
  row.querySelectorAll('.star').forEach((btn, i) => btn.classList.toggle('hovered', i < n));
}

function unhoverRating(name) {
  const row = document.getElementById('stars-' + name);
  if (!row) return;
  row.querySelectorAll('.star').forEach(btn => btn.classList.remove('hovered'));
}

function logMeeting() {
  const today     = new Date();
  const week      = today.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  const m         = Math.floor(totalElapsed / 60);
  const s         = totalElapsed % 60;
  const totalTime = `${m}:${s.toString().padStart(2,'0')}`;

  // Compute average of all entered ratings
  const vals = TEAM.map(n => ratings[n]).filter(r => r > 0);
  const avg  = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '';

  sync({
    action:    'logHistory',
    week:       week,
    totalTime:  totalTime,
    average:    avg,
    bitty:      ratings['Bitty']     || '',
    charlotte:  ratings['Charlotte'] || '',
    jay:        ratings['Jay']       || '',
    lori:       ratings['Lori']      || '',
    mike:       ratings['Mike']      || '',
    vendela:    ratings['Vendela']   || '',
    recording:  '',
  });

  // Stop meeting clock and show the complete overlay
  if (meetingTick) { clearInterval(meetingTick); meetingTick = null; }
  stopTimer();
  document.getElementById('done-overlay').classList.add('show');
}

/* ══ ROCKS ═══════════════════════════════════════════════════════ */
function renderRocks() {
  const c = document.getElementById('rocks-container');
  c.innerHTML = rocks.map(r => `
    <div class="rock-card ${r.status}" id="rock-${r.id}">
      <div class="rock-card-header">
        <div class="rock-num-badge">${r.id + 1}</div>
        <div class="rock-card-title">${r.title}</div>
        <button class="status-toggle ${r.status}" onclick="toggleRockStatus(${r.id})">
          <span class="st-dot"></span>${r.status === 'on-track' ? 'On Track' : 'Off Track'}
        </button>
      </div>
      <div class="rock-card-meta">
        <span class="rock-owner-tag">${r.owner}</span>
        <span class="lever-tag">${r.lever}</span>
      </div>
      ${r.done ? `<div class="rock-done-text">${r.done}</div>` : ''}
    </div>`).join('');
}

function toggleRockStatus(id) {
  const r = rocks.find(x => x.id === id);
  r.status = r.status === 'on-track' ? 'off-track' : 'on-track';
  renderRocks();
  sync({ action: 'updateRockStatus', rockTitle: r.title, status: r.status });
}

/* ══ GOALS ═══════════════════════════════════════════════════════ */
function renderGoals() {
  const c = document.getElementById('goals-container');
  c.innerHTML = goals.map(g => `
    <div class="goal-card">
      <div class="goal-card-header">
        <div class="goal-person">${g.person}</div>
        <span class="goal-rock-tag">Rocks ${g.rocks}</span>
        <button class="status-toggle ${g.status}" style="margin-left:auto;" onclick="toggleGoalStatus('${g.person}')">
          <span class="st-dot"></span>${g.status === 'on-track' ? 'On Track' : 'Off Track'}
        </button>
      </div>
      <div class="goals-list">
        ${g.items.map(item => `
          <div class="goal-item-row${g.warn ? ' goal-warn' : ''}">${item}</div>`).join('')}
      </div>
    </div>`).join('');
}

function toggleGoalStatus(person) {
  const g = goals.find(x => x.person === person);
  g.status = g.status === 'on-track' ? 'off-track' : 'on-track';
  renderGoals();
  sync({ action: 'updateGoalStatus', person: g.person, status: g.status });
}

/* ══ ISSUES ══════════════════════════════════════════════════════ */
function issueCardHTML(issue, i) {
  return `
    <div class="issue-card ${issue.completed ? 'completed' : ''}"
         id="issue-${issue.id}" draggable="true"
         ondragstart="dragStart(event,${i})" ondragover="dragOver(event)"
         ondrop="dragDrop(event,${i})" ondragleave="dragLeave(event)"
         ondragend="dragEnd(event)">
      <div class="issue-top">
        <div class="issue-drag-num" title="Drag to reorder">
          <span class="num-label">${i + 1}</span>
          <span class="dots-label">⠿</span>
        </div>
        <div class="issue-stripe ${priorityClass(issue.priority)}"></div>
        <div class="issue-body" onclick="toggleIssueExpand(${issue.id})">
          <input class="issue-title-input"
                 value="${issue.title.replace(/"/g, '&quot;')}"
                 onclick="event.stopPropagation()"
                 onblur="saveIssueTitle(${issue.id}, this.value)" />
          ${issue.owner ? `<div class="issue-owner-line">${issue.owner}</div>` : ''}
        </div>
        <div class="issue-actions">
          <button class="btn-complete" title="${issue.completed ? 'Reopen' : 'Mark complete'}"
                  onclick="event.stopPropagation(); toggleIssueComplete(${issue.id})">
            ${issue.completed ? '✓' : ''}
          </button>
        </div>
      </div>
      <div class="issue-notes-section">
        <div class="issue-notes-label">Notes</div>
        <textarea class="issue-notes-input" placeholder="Add notes, decisions, or next steps…"
          oninput="autoResizeTextarea(this)"
          onblur="saveIssueNotes(${issue.id}, this.value)">${issue.notes || ''}</textarea>
      </div>
    </div>`;
}

function renderIssues() {
  const c = document.getElementById('issues-container');
  const active    = issues.filter(x => !x.completed);
  const completed = issues.filter(x =>  x.completed);
  let html = active.map((issue, i) => issueCardHTML(issue, i)).join('');
  if (completed.length) {
    html += `<div class="issues-section-label">Completed (${completed.length})</div>`;
    html += completed.map((issue, i) => issueCardHTML(issue, active.length + i)).join('');
  }
  c.innerHTML = html;
}

function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

function toggleIssueExpand(id) {
  const card = document.getElementById('issue-' + id);
  if (card.classList.contains('expanded')) {
    issues.find(x => x.id === id).notes = card.querySelector('.issue-notes-input').value;
    card.classList.remove('expanded');
  } else {
    // Close any other open notes panel first
    document.querySelectorAll('.issue-card.expanded').forEach(c => {
      const otherId = parseInt(c.id.replace('issue-', ''));
      const otherIssue = issues.find(x => x.id === otherId);
      if (otherIssue) otherIssue.notes = c.querySelector('.issue-notes-input').value;
      c.classList.remove('expanded');
    });
    card.classList.add('expanded');
    const ta = card.querySelector('.issue-notes-input');
    autoResizeTextarea(ta);
    ta.focus();
  }
}

function saveIssueTitle(id, value) {
  const issue = issues.find(x => x.id === id);
  if (!issue) return;
  if (!value.trim()) {
    sync({ action: 'deleteIssue', issueTitle: issue.title });
    issues = issues.filter(x => x.id !== id);
    renderIssues();
    return;
  }
  const oldTitle = issue.title;
  issue.title = value.trim();
  if (oldTitle !== issue.title) {
    sync({ action: 'updateIssueTitle', oldTitle, newTitle: issue.title });
  }
}

function saveIssueNotes(id, value) {
  const issue = issues.find(x => x.id === id);
  if (!issue) return;
  issue.notes = value;
  sync({ action: 'updateIssueNotes', issueTitle: issue.title, notes: value });
}

function priorityClass(p) { return 'priority-' + p; }

function sortIssues() {
  issues.sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });
}

function toggleIssueComplete(id) {
  const issue = issues.find(x => x.id === id);
  if (!issue) return;
  issue.completed = !issue.completed;
  sortIssues();
  renderIssues();
  sync({ action: 'markIssueComplete', issueTitle: issue.title, completed: String(issue.completed) });
}

/* ── Drag & Drop ── */
let dragSrcIdx = null;
let dragSrcEl  = null;
let dragOverEl = null;

function dragStart(e, idx) {
  dragSrcIdx = idx;
  dragSrcEl  = e.target.closest('.issue-card');
  dragSrcEl?.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}
function dragOver(e) {
  e.preventDefault();
  const card = e.target.closest('.issue-card');
  if (card && card !== dragOverEl) {
    dragOverEl?.classList.remove('drag-over');
    dragOverEl = card;
    card.classList.add('drag-over');
  }
  e.dataTransfer.dropEffect = 'move';
}
function dragLeave(e) {
  const card = e.target.closest('.issue-card');
  if (card === dragOverEl && !card?.contains(e.relatedTarget)) {
    card.classList.remove('drag-over');
    dragOverEl = null;
  }
}
function dragDrop(e, toIdx) {
  e.stopPropagation();
  dragOverEl?.classList.remove('drag-over');
  dragOverEl = null;
  if (dragSrcIdx !== null && dragSrcIdx !== toIdx) {
    const moved = issues.splice(dragSrcIdx, 1)[0];
    issues.splice(toIdx, 0, moved);
    renderIssues();
  }
}
function dragEnd() {
  dragSrcEl?.classList.remove('dragging');
  dragOverEl?.classList.remove('drag-over');
  dragSrcEl = dragOverEl = null;
  dragSrcIdx = null;
}


/* ══ TODOS ═══════════════════════════════════════════════════════ */
function todoStatusLabel(s) {
  if (s === 'in-process')  return 'In process';
  if (s === 'completed')   return 'Completed';
  return 'Not started';
}

function todoRowHTML(t) {
  return `
    <tr class="status-${t.status}">
      <td class="todo-check-cell" onclick="toggleTodoDone(${t.id})">
        <div class="todo-circle">${t.status === 'completed' ? '✓' : ''}</div>
      </td>
      <td class="todo-action-text">
        <input class="todo-action-input" value="${t.text.replace(/"/g,'&quot;')}"
               onblur="saveTodoField(${t.id},'text',this.value)" />
      </td>
      <td>
        <input class="todo-inline-input" value="${(t.owner||'').replace(/"/g,'&quot;')}"
               placeholder="—" list="team-list"
               onblur="saveTodoField(${t.id},'owner',this.value)" />
      </td>
      <td>
        <input class="todo-inline-input" type="date" value="${t.due || ''}"
               onchange="saveTodoField(${t.id},'due',this.value)" />
      </td>
      <td>
        <button class="todo-status-btn ${t.status}" onclick="cycleTodoStatus(${t.id})">
          ${todoStatusLabel(t.status)}
        </button>
      </td>
    </tr>`;
}

function completedTodoCardHTML(t) {
  const due = t.due ? ` · ${t.due}` : '';
  const sub = (t.owner || t.due) ? `<div class="issue-owner-line">${t.owner}${due}</div>` : '';
  return `
    <div class="issue-card completed" id="todo-card-${t.id}">
      <div class="issue-top">
        <div class="issue-stripe priority-medium"></div>
        <div class="issue-body">
          <input class="issue-title-input" value="${t.text.replace(/"/g,'&quot;')}"
                 onblur="saveTodoField(${t.id},'text',this.value)" />
          ${sub}
        </div>
        <div class="issue-actions">
          <button class="btn-complete" title="Reopen" onclick="toggleTodoDone(${t.id})">✓</button>
        </div>
      </div>
    </div>`;
}

function renderTodos() {
  const active    = todos.filter(t => t.status !== 'completed');
  const completed = todos.filter(t => t.status === 'completed');

  // Active todos — table rows
  document.getElementById('todos-container').innerHTML = active.map(t => todoRowHTML(t)).join('');

  // Completed todos — cards below the table, matching Discussion section style
  const completedEl = document.getElementById('todos-completed');
  if (!completedEl) return;
  if (completed.length) {
    completedEl.innerHTML =
      `<div class="issues-section-label">Completed (${completed.length})</div>` +
      `<div class="issues-list">${completed.map(t => completedTodoCardHTML(t)).join('')}</div>`;
  } else {
    completedEl.innerHTML = '';
  }
}

function toggleTodoDone(id) {
  const t = todos.find(x => x.id === id);
  t.status = t.status === 'completed' ? 'not-started' : 'completed';
  renderTodos();
  sync({ action: 'markTodoDone', todoText: t.text, status: t.status });
}

function cycleTodoStatus(id) {
  const t = todos.find(x => x.id === id);
  const cycle = ['not-started', 'in-process', 'completed'];
  t.status = cycle[(cycle.indexOf(t.status) + 1) % cycle.length];
  renderTodos();
  sync({ action: 'markTodoDone', todoText: t.text, status: t.status });
}

function saveTodoField(id, field, value) {
  const t = todos.find(x => x.id === id);
  if (!t) return;
  if (field === 'text' && !value.trim()) {
    sync({ action: 'deleteTodo', todoText: t.text });
    todos = todos.filter(x => x.id !== id);
    renderTodos();
    return;
  }
  t[field] = value;
  if (field === 'owner' || field === 'due') {
    sync({ action: 'updateTodoField', todoText: t.text, field, value });
  }
}

/* ── Capture popup ── */
function openCapture(tab) {
  const isOpen = elCaptureModal?.classList.contains('open');
  if (isOpen && !tab) { closeCapture(); return; }
  switchCaptureTab(tab || 'issue');
  elCaptureModal?.classList.add('open');
  const focusId = tab === 'todo' ? 'cap-todo-text' : 'cap-issue-title';
  requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(focusId).focus()));
}

function closeCapture() {
  elCaptureModal?.classList.remove('open');
}

document.addEventListener('click', e => {
  if (elCaptureModal?.classList.contains('open') && !elCaptureModal.contains(e.target) && e.target !== elCaptureFab) {
    closeCapture();
  }

  // Collapse expanded issue note if click lands outside any issue card
  if (!e.target.closest('.issue-card')) {
    document.querySelectorAll('.issue-card.expanded').forEach(c => {
      const id = parseInt(c.id.replace('issue-', ''));
      const issue = issues.find(x => x.id === id);
      const ta = c.querySelector('.issue-notes-input');
      if (issue && ta) {
        issue.notes = ta.value;
        saveIssueNotes(id, ta.value);
      }
      c.classList.remove('expanded');
    });
  }
});

function switchCaptureTab(tab) {
  ['issue', 'todo'].forEach(t => {
    document.getElementById('cap-tab-' + t).classList.toggle('active', t === tab);
    document.getElementById('cap-pane-' + t).classList.toggle('active', t === tab);
  });
}

function submitCaptureIssue() {
  const title    = document.getElementById('cap-issue-title').value.trim();
  const owner    = document.getElementById('cap-issue-owner').value.trim();
  const priority = document.getElementById('cap-issue-priority').value || 'medium';
  const notes    = document.getElementById('cap-issue-notes').value.trim();
  if (!title) { document.getElementById('cap-issue-title').focus(); return; }

  issues.push({ id: Date.now(), title, owner, priority, notes, completed: false });
  renderIssues();
  sync({ action: 'addIssue', title, owner, priority, notes });

  document.getElementById('cap-issue-title').value = '';
  document.getElementById('cap-issue-owner').value = '';
  document.getElementById('cap-issue-priority').value = '';
  document.getElementById('cap-issue-notes').value = '';
  closeCapture();
}

function submitCaptureTodo() {
  const text  = document.getElementById('cap-todo-text').value.trim();
  const owner = document.getElementById('cap-todo-owner').value.trim();
  const due   = document.getElementById('cap-todo-due').value;
  if (!text) { document.getElementById('cap-todo-text').focus(); return; }

  todos.push({ id: Date.now(), text, owner, due, status: 'not-started' });
  renderTodos();
  sync({ action: 'addTodo', text, owner, due, status: 'not-started' });

  document.getElementById('cap-todo-text').value = '';
  document.getElementById('cap-todo-owner').value = '';
  document.getElementById('cap-todo-due').value = '';
  closeCapture();
}



/* ══ SCORECARD SPARKLINES ═══════════════════════════════════════════ */
function buildSparklines() {
  document.querySelectorAll('table.sc tbody tr').forEach(row => {
    const td = row.querySelector('.trend-cell');
    if (!td) return;
    const cells = [...row.querySelectorAll('.week-cell:not(.is-empty)')];
    if (cells.length < 2) { td.innerHTML = '<span style="color:var(--text-faint);font-size:12px">—</span>'; return; }
    const vals = cells.map(c => parseFloat(c.textContent.replace(/[$,%]/g, '').replace(/,/g, '')));
    const w = 60, h = 22;
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;
    const pts = vals.map((v, i) => [
      (i / (vals.length - 1)) * w,
      h - ((v - min) / range * (h - 6) + 3)
    ]);
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const lp = pts[pts.length - 1];
    // Color from status badge in the same row
    const badge = row.querySelector('.status-cell .badge');
    const color = badge?.classList.contains('badge-green') ? '#8bac14'
                : badge?.classList.contains('badge-red')   ? '#EF4444'
                : '#9CA3AF'; // gray for no-target / no-data
    td.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" style="display:block;margin:0 auto">
      <path d="${d}" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${lp[0].toFixed(1)}" cy="${lp[1].toFixed(1)}" r="2.5" fill="${color}"/>
    </svg>`;
  });
}

function normalizeLatestCells() {
  const table = document.querySelector('table.sc');
  if (!table) return;
  const headRow = table.querySelector('thead tr');
  if (!headRow) return;
  // Find the rightmost visible week column index
  const allTh = [...headRow.children];
  let latestColIdx = -1;
  for (let i = allTh.length - 1; i >= 0; i--) {
    if (allTh[i].classList.contains('week-head') && allTh[i].style.display !== 'none') {
      latestColIdx = i; break;
    }
  }
  if (latestColIdx < 0) return;
  // Strip is-latest everywhere, then re-apply only to non-empty cells in that column
  table.querySelectorAll('tbody tr').forEach(row => {
    [...row.children].forEach((td, i) => {
      td.classList.remove('is-latest');
      if (i === latestColIdx && !td.classList.contains('is-empty')) {
        td.classList.add('is-latest');
      }
    });
  });
}

function markLatestWeekHead() {
  const table = document.querySelector('table.sc');
  if (!table) return;
  const headRow = table.querySelector('thead tr');
  if (!headRow) return;
  const allTh = [...headRow.children];
  allTh.forEach(th => th.classList.remove('is-latest-head'));
  // Mark the rightmost visible week-head as current
  for (let i = allTh.length - 1; i >= 0; i--) {
    if (allTh[i].classList.contains('week-head') && allTh[i].style.display !== 'none') {
      allTh[i].classList.add('is-latest-head');
      break;
    }
  }
}

function hideEmptyWeekCols() {
  const table = document.querySelector('table.sc');
  if (!table) return;
  const headers = [...table.querySelectorAll('th.week-head')];
  headers.forEach(th => {
    const colIdx = [...th.parentElement.children].indexOf(th);
    const rows = [...table.querySelectorAll('tbody tr')];
    const allEmpty = rows.every(row => {
      const cell = row.children[colIdx];
      return !cell || cell.classList.contains('is-empty');
    });
    if (allEmpty) {
      th.style.display = 'none';
      rows.forEach(row => { const c = row.children[colIdx]; if (c) c.style.display = 'none'; });
    }
  });
}

/* ══ SYNC ════════════════════════════════════════════════════════ */
function sync(params) {
  if (!SYNC_URL) return;
  fetch(SYNC_URL + '?' + new URLSearchParams(params).toString(), { mode: 'no-cors' }).catch(() => {});
  if (!elSyncDot) return;
  elSyncDot.classList.add('flash');
  if (elSyncLabel) elSyncLabel.textContent = 'Saved';
  setTimeout(() => {
    elSyncDot.classList.remove('flash');
    elSyncDot.classList.add('connected');
    if (elSyncLabel) elSyncLabel.textContent = 'Synced';
  }, 1200);
}

let lastScorecardHash = null;
function renderScorecard(rows) {
  const hash = JSON.stringify(rows);
  if (hash === lastScorecardHash) return;
  lastScorecardHash = hash;
  if (!rows || rows.length < 2) return;

  const table = document.querySelector('table.sc');
  if (!table) return;

  const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  function toMonD(v) {
    if (!v && v !== 0) return '';
    const s = String(v).trim();
    if (/^[A-Za-z]{3}\s+\d{1,2}$/.test(s)) return s.toLowerCase();
    const parsed = new Date(s.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s + 'T12:00:00' : s);
    if (!isNaN(parsed)) return MONTHS[parsed.getMonth()] + ' ' + parsed.getDate();
    return '';
  }

  // ── 1. Find header row (most date-like cells) ─────────────────────
  let headerRowIdx = -1, headerDateCols = {};
  for (let i = 0; i < Math.min(rows.length, 8); i++) {
    const dc = {};
    rows[i].forEach((cell, ci) => { const d = toMonD(cell); if (d) dc[ci] = d; });
    if (Object.keys(dc).length > Object.keys(headerDateCols).length) { headerRowIdx = i; headerDateCols = dc; }
  }
  if (headerRowIdx < 0 || !Object.keys(headerDateCols).length) return;

  const sortedDateCols   = Object.entries(headerDateCols).sort((a, b) => +a[0] - +b[0]);
  const firstDateColIdx  = +sortedDateCols[0][0];
  const lastDateColIdx   = +sortedDateCols[sortedDateCols.length - 1][0];
  const headerRow        = rows[headerRowIdx];
  const hNorm = s => String(s || '').replace(/[^a-z]/gi, '').toLowerCase();

  // ── 2. Identify metadata columns ────────────────────────────────
  let kpiCol = 0, ownerCol = -1, targetCol = -1, statusCol = -1;
  for (let ci = 0; ci < firstDateColIdx; ci++) {
    const h = hNorm(headerRow[ci]);
    if (!h) continue;
    if      (h.includes('owner') || h.includes('lead') || h.includes('person')) ownerCol  = ci;
    else if (h.includes('target') || h.includes('goal'))                         targetCol = ci;
    else if (h.includes('kpi') || h.includes('metric') || h.includes('name'))   kpiCol    = ci;
  }
  // Positional fallback: if still no owner found, assume the column right after kpiCol
  if (ownerCol < 0 && kpiCol + 1 < firstDateColIdx) ownerCol = kpiCol + 1;
  for (let ci = lastDateColIdx + 1; ci < headerRow.length; ci++) {
    const h = hNorm(String(headerRow[ci] || ''));
    if (h.includes('status') || h.includes('track')) { statusCol = ci; break; }
  }

  // ── 3. Rebuild thead week-heads ──────────────────────────────────
  const theadRow = table.querySelector('thead tr');
  [...theadRow.querySelectorAll('.week-head')].forEach(th => th.remove());
  const trendTh = theadRow.querySelector('.trend-head');
  sortedDateCols.forEach(([, dateStr]) => {
    const [mon, day] = dateStr.split(' ');
    const th = document.createElement('th');
    th.className = 'week-head';
    th.textContent = mon.charAt(0).toUpperCase() + mon.slice(1) + ' ' + day;
    theadRow.insertBefore(th, trendTh);
  });

  // ── 4. Rebuild tbody ─────────────────────────────────────────────
  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';

  const skipKpi      = new Set(['kpi','metric','name','item','owner','target','goal','status','no','key','legend','note','notes','source']);
  const skipKpiStart = ['key','legend','note','higher','lower','source','red ','green '];
  rows.slice(headerRowIdx + 1).forEach(row => {
    const kpiName    = String(row[kpiCol] || '').trim();
    const kpiNormed  = kpiName.replace(/[^a-z]/gi,'').toLowerCase();
    const kpiLower   = kpiName.toLowerCase();
    if (!kpiName) return;
    if (skipKpi.has(kpiNormed)) return;
    if (skipKpiStart.some(s => kpiLower.startsWith(s))) return;

    const tr = document.createElement('tr');
    // Strip direction arrow from display name; show as small superscript
    const dirMatch  = kpiName.match(/[▲▼]/);
    const kpiDisplay = kpiName.replace(/\s*[▲▼]\s*/g, '').trim();
    const kpiTd = scTd(tr, 'kpi-cell', kpiDisplay);
    if (dirMatch) {
      const sup = document.createElement('span');
      sup.className = 'kpi-dir';
      sup.textContent = dirMatch[0];
      kpiTd.appendChild(sup);
    }
    scTd(tr, 'owner-cell',  ownerCol  >= 0 ? String(row[ownerCol]  || '').trim() : '');
    scTd(tr, 'target-cell', targetCol >= 0 ? String(row[targetCol] || '').trim() : '');

    sortedDateCols.forEach(([colIdx]) => {
      const td = document.createElement('td');
      td.className = 'week-cell';
      const v = String(row[+colIdx] ?? '').trim();
      if (v) { td.textContent = v; }
      else   { td.textContent = '—'; td.classList.add('is-empty'); }
      tr.appendChild(td);
    });

    scTd(tr, 'trend-cell', '');

    const statusRaw = statusCol >= 0 ? String(row[statusCol] || '').toLowerCase() : '';
    const targetStr = targetCol >= 0 ? String(row[targetCol] || '').trim() : '';
    const latestVal = (() => {
      for (let j = sortedDateCols.length - 1; j >= 0; j--) {
        const v = String(row[+sortedDateCols[j][0]] ?? '').trim();
        if (v) return v;
      }
      return '';
    })();
    const tdStatus = document.createElement('td');
    tdStatus.className = 'status-cell';
    tdStatus.innerHTML = scStatusBadge(statusRaw, kpiName, targetStr, latestVal);
    tr.appendChild(tdStatus);

    tbody.appendChild(tr);
  });

  buildSparklines();
  hideEmptyWeekCols();
  normalizeLatestCells();
  markLatestWeekHead();
}

function scTd(tr, cls, text) {
  const td = document.createElement('td');
  td.className = cls;
  td.textContent = text;
  tr.appendChild(td);
  return td;
}

function scStatusBadge(raw, kpiName, targetStr, latestVal) {
  // Prefer explicit sheet status
  if (raw.includes('off') || raw.includes('🔴') || raw.includes('behind'))
    return '<span class="badge badge-red"><span class="badge-dot"></span>Off Track</span>';
  if (raw.includes('🟢') || (raw.includes('on') && raw.includes('track')))
    return '<span class="badge badge-green"><span class="badge-dot"></span>On Track</span>';
  if (raw.includes('no data') || raw.includes('nodata'))
    return '<span class="badge badge-gray"><span class="badge-dot"></span>No Data</span>';

  // Compute from target + direction when no explicit status
  const tgt = String(targetStr || '').trim();
  if (!tgt || /^(tbd|–|—|-|n\/a)$/i.test(tgt) || !latestVal || latestVal === '—')
    return '<span class="badge badge-gray"><span class="badge-dot"></span>No Target</span>';

  const parseN = s => parseFloat(String(s).replace(/[$,%]/g,'').replace(/\s*hr?s?/i,'').replace(/k$/i,'000').replace(/,/g,''));
  const latN = parseN(latestVal);
  const opMatch = tgt.match(/^([≥≤<>])\s*/);
  const tgtN = parseN(tgt.replace(/^[≥≤<>$\s]*/,''));
  if (isNaN(latN) || isNaN(tgtN))
    return '<span class="badge badge-gray"><span class="badge-dot"></span>No Target</span>';

  const lowerBetter = kpiName.includes('▼') || (opMatch && (opMatch[1] === '<' || opMatch[1] === '≤'));
  const onTrack = lowerBetter ? latN <= tgtN : latN >= tgtN;
  return onTrack
    ? '<span class="badge badge-green"><span class="badge-dot"></span>On Track</span>'
    : '<span class="badge badge-red"><span class="badge-dot"></span>Off Track</span>';
}

let _jsonpSeq = 0;
function jsonpLoad(action, onData) {
  if (!SYNC_URL) return;
  const cb = 'cb_' + (++_jsonpSeq);
  const script = document.createElement('script');
  window[cb] = function(data) {
    delete window[cb];
    script.parentNode?.removeChild(script);
    onData(data);
  };
  script.onerror = () => { delete window[cb]; script.parentNode?.removeChild(script); };
  script.src = SYNC_URL + '?action=' + action + '&callback=' + cb;
  document.head.appendChild(script);
}

function loadConfig() {
  jsonpLoad('getConfig', data => { if (data.ok && data.rows) applyConfig(data.rows); });
}

function applyConfig(rows) {
  rows.forEach(row => {
    const name = String(row[0]).trim();
    const mins = parseFloat(row[1]);
    if (!name || isNaN(mins)) return; // skip header or blank rows
    const idx = SECTIONS.findIndex(s =>
      s.shortName.toLowerCase() === name.toLowerCase() ||
      s.name.toLowerCase().includes(name.toLowerCase())
    );
    if (idx >= 0) {
      SECTIONS[idx].mins = mins;
      sectionTimers[idx] = mins * 60;
    }
  });
  TOTAL_MINS = SECTIONS.reduce((sum, s) => sum + s.mins, 0);
  localStorage.setItem('tulip-section-mins', JSON.stringify(SECTIONS.map(s => s.mins)));
  if (!timerRunning) {
    timerSecs = sectionTimers[currentIdx];
    renderTimer();
  }
  buildNav();
}

function loadFromSheets() {
  jsonpLoad('getData', data => {
    if (!data.ok) {
      if (elSyncLabel) elSyncLabel.textContent = 'Offline';
      elSyncDot?.classList.remove('connected');
      return;
    }
    renderScorecard(data.rows);
    if (elSyncLabel) elSyncLabel.textContent = 'Synced';
    elSyncDot?.classList.add('connected');
  });
}

function loadIssues() {
  jsonpLoad('getIssues', data => { if (data.ok && data.rows) applyIssues(data.rows); });
}

function applyIssues(rows) {
  // Col A=title, B=owner, C=priority, D=status, E=notes
  //
  // Header detection strategy:
  //   1. Look for the true COLUMN header row: col A has a header keyword AND col B has 'owner'/'person'
  //      This skips section-title rows like "ISSUES — Identify → Discuss → Solve" which only fill col A
  //   2. Fallback: exact-match single col-A header word (e.g. bare "Issue" or "Discussion")
  //   3. Last resort: default to row-index 6 (A7 per sheet layout)
  const COL_TERMS = ['discussion', 'issue', 'title', 'topic', 'item', '#'];
  const META_EXACT = new Set(['discussion', 'issue', 'title', 'topic', 'item', '#',
                               'owner', 'priority', 'status', 'notes']);
  let headerIdx = -1;

  // Pass 1 — two-column check (most reliable)
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const a = String(rows[i][0] || '').toLowerCase().trim();
    const b = String(rows[i][1] || '').toLowerCase().trim();
    if (COL_TERMS.some(t => a.includes(t)) && (b.includes('owner') || b.includes('person'))) {
      headerIdx = i; break;
    }
  }
  // Pass 2 — single col-A exact match fallback
  if (headerIdx < 0) {
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const a = String(rows[i][0] || '').toLowerCase().trim();
      if (a.includes('·')) continue;
      if (META_EXACT.has(a)) { headerIdx = i; break; }
    }
  }
  const startIdx = headerIdx >= 0 ? headerIdx + 1 : 6;

  // Filter helper — catches any stray metadata rows that slip past startIdx
  const isMeta = r => {
    const a = String(r[0] || '').trim();
    if (!a) return true;
    if (a.includes('·')) return true;                                    // instruction/branding rows
    if (META_EXACT.has(a.replace(/[^a-z#]/gi, '').toLowerCase())) return true; // bare header words
    return false;
  };

  const data = rows.slice(startIdx).filter(r => !isMeta(r));
  if (!data.length) return;

  issues = data.map((r, i) => {
    const priStr    = String(r[2] || '').toLowerCase();
    const statusStr = String(r[3] || '').toLowerCase();
    const notesStr  = String(r[4] || '').trim();
    const completed = statusStr.includes('done') || statusStr.includes('complet') ||
                      statusStr.includes('solved') || statusStr.includes('closed') ||
                      statusStr.includes('resolved') || statusStr.includes('✅');
    return {
      id: i,
      title:    String(r[0] || '').trim(),
      owner:    String(r[1] || '').trim(),
      priority: priStr.includes('high') ? 'high' : priStr.includes('low') ? 'low' : 'medium',
      notes:    notesStr,
      completed,
    };
  });
  sortIssues();
  renderIssues();
}

function loadRocks() {
  jsonpLoad('getRocks', data => { if (data.ok && data.rows) applyRocks(data.rows); });
}

function applyRocks(rows) {
  const SKIP = new Set(['', 'rock', 'rocks', 'title', '#', 'owner', 'status', 'lever', 'done']);
  rows.forEach(row => {
    const title = String(row[1] || '').trim();
    const firstWord = title.replace(/[^a-z0-9 ]/gi, '').trim().toLowerCase().split(/\s+/)[0];
    if (!title || SKIP.has(firstWord)) return;
    const statusRaw = String(row[3] || '').toLowerCase(); // col D
    const rock = rocks.find(r =>
      r.title.toLowerCase().includes(title.toLowerCase().substring(0, 20)) ||
      title.toLowerCase().includes(r.title.toLowerCase().substring(0, 20))
    );
    if (!rock) return;
    if (statusRaw.includes('off') || statusRaw.includes('🔴')) rock.status = 'off-track';
    else if (statusRaw.includes('on') || statusRaw.includes('🟢') || statusRaw.includes('done') || statusRaw.includes('complete')) rock.status = 'on-track';
  });
  renderRocks();
}

function loadGoals() {
  jsonpLoad('getGoals', data => { if (data.ok && data.rows) applyGoals(data.rows); });
}

function applyGoals(rows) {
  const SKIP = new Set(['', 'goal', 'goals', 'person', 'name', '#', 'owner', 'status']);
  rows.forEach(row => {
    const nameA     = String(row[0] || '').trim().toLowerCase(); // col A = Person
    const statusRaw = String(row[5] || '').toLowerCase();        // col F = Status
    const firstA = nameA.replace(/[^a-z0-9 ]/gi, '').split(/\s+/)[0];
    if (!nameA || SKIP.has(firstA)) return;
    const goal = goals.find(g => {
      const p = g.person.toLowerCase();
      return p === nameA || nameA.startsWith(p) || p.startsWith(nameA);
    });
    if (!goal) return;
    if (statusRaw.includes('off') || statusRaw.includes('🔴')) goal.status = 'off-track';
    else if (statusRaw.includes('on') || statusRaw.includes('🟢') || statusRaw.includes('done') || statusRaw.includes('complet')) goal.status = 'on-track';
  });
  renderGoals();
}

function loadTodos() {
  jsonpLoad('getTodos', data => { if (data.ok && data.rows) applyTodos(data.rows); });
}

function applyTodos(rows) {
  // Col A=action, B=owner, C=due, D=status
  // Find the header row (first row where col A is 'action'/'todo'/'task')
  // Fallback: data starts at row index 6 (A7) per sheet layout
  let headerIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const a = String(rows[i][0] || '').toLowerCase().trim();
    if (a === 'action' || a === 'todo' || a === 'task' || a === 'to-do') { headerIdx = i; break; }
  }
  const startIdx = headerIdx >= 0 ? headerIdx + 1 : 6;

  // Collect rows after the header, skipping blanks
  const dataRows = [];
  for (let i = startIdx; i < rows.length; i++) {
    const text = String(rows[i][0] || '').trim();
    if (text) dataRows.push(rows[i]); // skip blanks but keep going
  }
  if (!dataRows.length) return;

  todos = dataRows.map((r, i) => {
    const statStr = String(r[3] || '').toLowerCase();
    const status  = statStr.includes('done') || statStr.includes('✅') || statStr.includes('complet') ? 'completed'
                  : statStr.includes('process') || statStr.includes('progress') || statStr.includes('⏳') ? 'in-process'
                  : 'not-started';
    return {
      id: i,
      text:  String(r[0] || '').trim(),
      owner: String(r[1] || '').trim(),
      due:   String(r[2] || '').trim(),
      status,
    };
  });
  renderTodos();
}

/* ══ KEYBOARD ════════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeCapture(); return; }
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.code === 'Space')      { e.preventDefault(); toggleTimer(); }
  if (e.code === 'ArrowRight') nextSection();
  if (e.code === 'ArrowLeft' && currentIdx > 0) goToSection(currentIdx - 1);
});

/* ══ BOOT ════════════════════════════════════════════════════════ */
init();
