// ============================================================
// SUPABASE SETUP
// ============================================================

const SUPABASE_URL = 'https://ryflnqxlahjjuofxjjor.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZmxucXhsYWhqanVvZnhqam9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMTU4NDcsImV4cCI6MjA5NzY5MTg0N30._vb7V1PA7kI-WJPrkptiRuyKRDDk5yJd5NKufWRNui4';


// ============================================================
// GET PROJECT ID FROM URL
// brief.html?project=abc-123
// ============================================================

const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('project');


// ============================================================
// LOAD PROJECT FROM SUPABASE
// ============================================================

let taskStates = [];
let tasksData  = [];

async function loadBrief() {

  if (!projectId) {
    document.getElementById('brief-project-name').textContent = 'No project found';
    return;
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/projects?id=eq.${projectId}&select=*`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey':        SUPABASE_KEY
        }
      }
    );

    const data    = await response.json();
    const project = data[0];

    if (!project) {
      document.getElementById('brief-project-name').textContent = 'Project not found';
      return;
    }

    // Populate page with real data
    document.getElementById('brief-project-name').textContent    = project.project_name;
    document.getElementById('brief-client-name').textContent     = project.client_name;
    document.getElementById('brief-round').textContent           = '1';
    document.getElementById('original-feedback-text').textContent = project.feedback
      ? `"${project.feedback}"`
      : 'No feedback yet';
    document.getElementById('client-clarification').textContent  = project.clarification
      ? `"${project.clarification}"`
      : 'No clarification yet';

    // Set today's date
    const today = new Date();
    document.getElementById('brief-date').textContent = today.toLocaleDateString('en-US', {
      year:  'numeric',
      month: 'long',
      day:   'numeric'
    });

    // Update share link with real project ID
    document.getElementById('share-link').value =
      `${window.location.origin}/brief.html?project=${projectId}`;

    // Load tasks
    if (project.tasks && project.tasks.length > 0) {
      tasksData  = project.tasks;
      taskStates = tasksData.map(function() { return false; });
      renderTasks();
      updateProgress();
    } else {
      document.getElementById('task-list').innerHTML =
        '<p style="color: #aaa; font-size: 14px;">No tasks yet — the client needs to complete their review first.</p>';
      updateProgress();
    }

  } catch (error) {
    console.error('Failed to load brief:', error);
    document.getElementById('brief-project-name').textContent = 'Failed to load project';
  }
}


// ============================================================
// BUILD THE TASK LIST
// ============================================================

const taskList = document.getElementById('task-list');

function renderTasks() {
  taskList.innerHTML = '';

  tasksData.forEach(function(taskText, index) {
    const item = document.createElement('div');
    item.className = 'task-item' + (taskStates[index] ? ' completed' : '');

    item.innerHTML = `
      <div class="task-checkbox">${taskStates[index] ? '✓' : ''}</div>
      <p class="task-text">${taskText}</p>
    `;

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
// ============================================================

function updateProgress() {
  const total     = tasksData.length;
  const completed = taskStates.filter(function(s) { return s; }).length;
  const percent   = total > 0 ? Math.round((completed / total) * 100) : 0;

  document.getElementById('progress-done').textContent    = completed;
  document.getElementById('progress-total').textContent   = total;
  document.getElementById('progress-bar-fill').style.width = percent + '%';

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

loadBrief();