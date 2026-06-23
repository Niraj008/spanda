// ============================================================
// SUPABASE SETUP
// ============================================================

const SUPABASE_URL = 'https://ryflnqxlahjjuofxjjor.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZmxucXhsYWhqanVvZnhqam9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMTU4NDcsImV4cCI6MjA5NzY5MTg0N30._vb7V1PA7kI-WJPrkptiRuyKRDDk5yJd5NKufWRNui4';


// ============================================================
// CHECK SESSION
// If no session found, redirect to login
// ============================================================

const session = JSON.parse(localStorage.getItem('spanda_session'));

if (!session || !session.access_token) {
  window.location.href = 'login.html';
}

const accessToken = session.access_token;
const user        = session.user;


// ============================================================
// SHOW USER INFO IN HEADER
// ============================================================

const userName = user?.user_metadata?.full_name || user?.email || 'Artist';
document.getElementById('nav-user').textContent     = userName;
document.getElementById('welcome-message').textContent = `Welcome back, ${userName.split(' ')[0]}`;


// ============================================================
// LOG OUT
// ============================================================

document.getElementById('logout-btn').addEventListener('click', async function() {

  await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'apikey':        SUPABASE_KEY
    }
  });

  localStorage.removeItem('spanda_session');
  window.location.href = 'index.html';
});


// ============================================================
// LOAD PROJECTS
// Only loads projects belonging to the logged in user
// ============================================================

async function loadProjects() {

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/projects?user_id=eq.${user.id}&order=created_at.desc&select=*`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey':        SUPABASE_KEY
        }
      }
    );

    const projects = await response.json();

    document.getElementById('projects-loading').style.display = 'none';

    if (!projects.length) {
      document.getElementById('projects-empty').style.display = 'block';
      return;
    }

    document.getElementById('projects-grid').style.display = 'grid';
    renderProjects(projects);

  } catch (error) {
    console.error('Failed to load projects:', error);
    document.getElementById('projects-loading').style.display = 'none';
    document.getElementById('projects-empty').style.display   = 'block';
  }
}


// ============================================================
// RENDER PROJECT CARDS
// ============================================================

function renderProjects(projects) {

  const grid = document.getElementById('projects-grid');
  grid.innerHTML = '';

  projects.forEach(function(project) {

    // Determine status
    let status      = 'Awaiting review';
    let statusClass = 'status-pending';

    if (project.tasks && project.tasks.length > 0) {
      status      = 'Brief ready';
      statusClass = 'status-briefed';
    } else if (project.feedback) {
      status      = 'Feedback received';
      statusClass = 'status-reviewed';
    }

    // Format date
    const date = new Date(project.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day:   'numeric',
      year:  'numeric'
    });

    const card = document.createElement('div');
    card.className = 'project-card';

    card.innerHTML = `
      <div class="project-card-top">
        <div>
          <p class="project-card-name">${project.project_name}</p>
          <p class="project-card-client">${project.client_name}</p>
        </div>
        <span class="project-status ${statusClass}">${status}</span>
      </div>
      <div class="project-card-footer">
        <span class="project-card-date">${date}</span>
        <div class="project-card-links">
          <a class="project-link" href="review.html?project=${project.id}">Review link</a>
          <a class="project-link" href="brief.html?project=${project.id}">Brief</a>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}


// ============================================================
// INITIALISE
// ============================================================

loadProjects();