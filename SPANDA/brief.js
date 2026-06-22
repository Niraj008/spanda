// ============================================================
// BRIEF PAGE
// Shows the revision brief with tickable tasks.
// For now uses demo data — later this comes from Supabase.
// ============================================================


// ============================================================
// DEMO DATA
// In the real product this will be passed from review.html
// via URL parameters or loaded from the database.
// ============================================================

const briefData = {
  projectName:        "Nike Ad — Final Cut v2",
  clientName:         "Nike",
  round:              1,
  originalFeedback:   "Needs more energy. Something about the pacing isn't working.",
  clientClarification:"The editing pace",
  tasks: [
    "Increase cut frequency in the action sequence — aim for cuts every 1 to 2 seconds",
    "Tighten the transition between scene 2 and scene 3 — currently feels sluggish",
    "Raise the music energy in the third act — switch to a higher BPM track or layer percussion",
    "Add subtle motion blur to fast camera movements to sell the speed",
    "Review the opening 10 seconds — the slow build may be killing momentum too early"
  ]
};


// ============================================================
// POPULATE PAGE WITH DATA
// ============================================================

document.getElementById('brief-project-name').textContent    = briefData.projectName;
document.getElementById('brief-client-name').textContent     = briefData.clientName;
document.getElementById('brief-round').textContent           = briefData.round;
document.getElementById('original-feedback-text').textContent = `"${briefData.originalFeedback}"`;
document.getElementById('client-clarification').textContent  = `"${briefData.clientClarification}"`;

// Set today's date
const today = new Date();
const dateString = today.toLocaleDateString('en-US', {
  year:  'numeric',
  month: 'long',
  day:   'numeric'
});
document.getElementById('brief-date').textContent = dateString;


// ============================================================
// BUILD THE TASK LIST
// Each task is a clickable card that toggles completed state
// ============================================================

const taskList  = document.getElementById('task-list');
const taskStates = briefData.tasks.map(function() { return false; });

function renderTasks() {
  taskList.innerHTML = '';

  briefData.tasks.forEach(function(taskText, index) {
    const item = document.createElement('div');
    item.className = 'task-item' + (taskStates[index] ? ' completed' : '');

    item.innerHTML = `
      <div class="task-checkbox">${taskStates[index] ? '✓' : ''}</div>
      <p class="task-text">${taskText}</p>
    `;

    // Toggle completed when clicked
    item.addEventListener('click', function() {
      taskStates[index] = !taskStates[index];
      renderTasks();
      updateProgress();
    });

    taskList.appendChild(item);
  });
}


// ============================================================
// PROGRESS BAR
// Updates the numbers and bar as tasks are ticked off
// ============================================================

function updateProgress() {
  const total     = briefData.tasks.length;
  const completed = taskStates.filter(function(s) { return s; }).length;
  const percent   = total > 0 ? Math.round((completed / total) * 100) : 0;

  document.getElementById('progress-done').textContent  = completed;
  document.getElementById('progress-total').textContent = total;
  document.getElementById('progress-bar-fill').style.width = percent + '%';

  // Show the all done message when everything is ticked
  if (completed === total && total > 0) {
    document.getElementById('all-done-box').style.display = 'block';
  } else {
    document.getElementById('all-done-box').style.display = 'none';
  }
}


// ============================================================
// RESET ALL TASKS
// ============================================================

document.getElementById('reset-btn').addEventListener('click', function() {
  taskStates.fill(false);
  renderTasks();
  updateProgress();
});


// ============================================================
// COPY SHARE LINK
// ============================================================

document.getElementById('copy-btn').addEventListener('click', function() {
  const link = document.getElementById('share-link').value;
  navigator.clipboard.writeText(link).then(function() {
    document.getElementById('copy-btn').textContent = 'Copied!';
    setTimeout(function() {
      document.getElementById('copy-btn').textContent = 'Copy';
    }, 2000);
  });
});


// ============================================================
// INITIALISE
// ============================================================

renderTasks();
updateProgress();