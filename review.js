// ============================================================
// SUPABASE + CLAUDE SETUP
// ============================================================

const SUPABASE_URL = 'https://ryflnqxlahjjuofxjjor.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZmxucXhsYWhqanVvZnhqam9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMTU4NDcsImV4cCI6MjA5NzY5MTg0N30._vb7V1PA7kI-WJPrkptiRuyKRDDk5yJd5NKufWRNui4';
const CLAUDE_KEY   = 'YOUR_CLAUDE_API_KEY_HERE';


// ============================================================
// GET PROJECT ID FROM URL
// When artist shares the link it looks like:
// review.html?project=abc-123
// We read that ID and use it to load the right project
// ============================================================

const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('project');


// ============================================================
// LOAD PROJECT FROM SUPABASE
// ============================================================

async function loadProject() {

  if (!projectId) {
    document.getElementById('review-project-name').textContent = 'No project found';
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
      document.getElementById('review-project-name').textContent = 'Project not found';
      return;
    }

    // Populate page with real project data
    document.getElementById('review-project-name').textContent = project.project_name;
    document.getElementById('review-client-name').textContent  = project.client_name;

    if (project.artist_note) {
      document.getElementById('artist-note-text').textContent  = project.artist_note;
      document.getElementById('artist-note-box').style.display = 'block';
    }

    // Show the uploaded file
    if (project.file_url) {
      const fileUrl = project.file_url;
      const isVideo = fileUrl.match(/\.(mp4|mov|webm)$/i);
      const isImage = fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);

      document.getElementById('media-placeholder').style.display = 'none';

      if (isImage) {
        const img = document.getElementById('review-image');
        img.src = fileUrl;
        img.style.display = 'block';
      } else if (isVideo) {
        const vid = document.getElementById('review-video');
        vid.src = fileUrl;
        vid.style.display = 'block';
      }
    }

  } catch (error) {
    console.error('Failed to load project:', error);
  }
}

loadProject();


// ============================================================
// STATE MANAGEMENT
// ============================================================

function showState(stateName) {
  document.getElementById('state-feedback').style.display = 'none';
  document.getElementById('state-question').style.display = 'none';
  document.getElementById('state-brief').style.display    = 'none';
  document.getElementById(stateName).style.display        = 'block';
}


// ============================================================
// STATE 1 → STATE 2
// Client submits feedback → Spanda asks a clarifying question
// ============================================================

let clientFeedback = '';
let selectedAnswer = '';

document.getElementById('submit-feedback-btn').addEventListener('click', async function() {

  const input = document.getElementById('feedback-input').value.trim();

  if (!input) {
    alert('Please write some feedback first.');
    return;
  }

  clientFeedback = input;
  document.getElementById('original-feedback-display').textContent = clientFeedback;
  showState('state-question');
  await askClarifyingQuestion(clientFeedback);
});


// ============================================================
// ASK AI FOR A CLARIFYING QUESTION
// ============================================================

async function askClarifyingQuestion(feedback) {

  document.getElementById('ai-thinking').style.display         = 'flex';
  document.getElementById('ai-question-content').style.display = 'none';

  const prompt = `
You are Spanda, an AI assistant for a VFX and animation review platform.

A client has given this feedback about a piece of creative work:
"${feedback}"

Your job is to ask ONE clarifying question that helps identify what the client specifically means, so the artist knows exactly what to fix.

Respond ONLY with a valid JSON object in this exact format, nothing else:
{
  "question": "Your clarifying question here",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
}

Rules:
- The question should be short and direct
- Give 3 to 5 options maximum
- Options should be specific and actionable
- Do not include any explanation outside the JSON
`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         CLAUDE_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 1000,
        messages:   [{ role: 'user', content: prompt }]
      })
    });

    const data   = await response.json();
    const text   = data.content[0].text;
    const parsed = JSON.parse(text);

    displayClarifyingQuestion(parsed.question, parsed.options);

  } catch (error) {
    displayClarifyingQuestion(
      "What aspect feels most off to you?",
      ["The pacing", "The visual style", "The music or sound", "The overall energy", "Something else"]
    );
  }
}


// ============================================================
// DISPLAY THE CLARIFYING QUESTION AND OPTIONS
// ============================================================

function displayClarifyingQuestion(question, options) {

  document.getElementById('ai-question-text').textContent = question;

  const container = document.getElementById('ai-options');
  container.innerHTML = '';

  options.forEach(function(optionText) {
    const btn = document.createElement('button');
    btn.className = 'ai-option';
    btn.innerHTML = `
      <span class="ai-option-check">✓</span>
      <span>${optionText}</span>
    `;

    btn.addEventListener('click', function() {
      document.querySelectorAll('.ai-option').forEach(function(b) {
        b.classList.remove('selected');
      });
      btn.classList.add('selected');
      selectedAnswer = optionText;
      document.getElementById('submit-answer-btn').style.display = 'block';
    });

    container.appendChild(btn);
  });

  document.getElementById('ai-thinking').style.display         = 'none';
  document.getElementById('ai-question-content').style.display = 'block';
}


// ============================================================
// STATE 2 → STATE 3
// Client picks answer → generate brief
// ============================================================

document.getElementById('submit-answer-btn').addEventListener('click', async function() {
  showState('state-brief');
  await generateRevisionBrief(clientFeedback, selectedAnswer);
});


// ============================================================
// GENERATE REVISION BRIEF
// ============================================================

async function generateRevisionBrief(feedback, answer) {

  document.getElementById('brief-thinking').style.display    = 'flex';
  document.getElementById('brief-output-list').style.display = 'none';

  const prompt = `
You are Spanda, an AI assistant for a VFX and animation review platform.

A client gave this feedback about a piece of creative work:
"${feedback}"

When asked to clarify, they said the main issue is: "${answer}"

Generate a concise revision brief for the artist. This should be a list of 3 to 5 specific, actionable tasks the artist can immediately act on.

Respond ONLY with a valid JSON object in this exact format, nothing else:
{
  "tasks": [
    "Task 1 here",
    "Task 2 here",
    "Task 3 here"
  ]
}

Rules:
- Each task must be specific and actionable
- Use plain language, no jargon
- Tasks should directly address the client's feedback and their clarification
- Do not include any explanation outside the JSON
`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         CLAUDE_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 1000,
        messages:   [{ role: 'user', content: prompt }]
      })
    });

    const data   = await response.json();
    const text   = data.content[0].text;
    const parsed = JSON.parse(text);

    // Save to Supabase
    await saveToSupabase(feedback, answer, parsed.tasks);

    displayRevisionBrief(parsed.tasks);

  } catch (error) {
    const fallbackTasks = [
      "Review the pacing of the sequence",
      "Adjust the edit rhythm to match the intended energy",
      "Check audio levels and music timing"
    ];
    await saveToSupabase(feedback, answer, fallbackTasks);
    displayRevisionBrief(fallbackTasks);
  }
}


// ============================================================
// SAVE FEEDBACK + TASKS TO SUPABASE
// This is what makes the brief page work —
// the data is saved here and loaded on brief.html
// ============================================================

async function saveToSupabase(feedback, clarification, tasks) {

  if (!projectId) return;

  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/projects?id=eq.${projectId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey':        SUPABASE_KEY,
          'Content-Type':  'application/json'
        },
        body: JSON.stringify({
          feedback:      feedback,
          clarification: clarification,
          tasks:         tasks
        })
      }
    );
  } catch (error) {
    console.error('Failed to save to Supabase:', error);
  }
}


// ============================================================
// DISPLAY THE REVISION BRIEF
// ============================================================

function displayRevisionBrief(tasks) {

  const list = document.getElementById('brief-output-list');
  list.innerHTML = '';

  tasks.forEach(function(task) {
    const li = document.createElement('li');
    li.textContent = task;
    list.appendChild(li);
  });

  const briefLink = `${window.location.origin}/brief.html?project=${projectId}`;
  const briefLinkBox = document.createElement('div');
  briefLinkBox.innerHTML = `
    <div style="margin-top: 1.5rem; padding: 1rem; background: #f7f7f5; border-radius: 8px; border: 1px solid #e8e8e8;">
      <p style="font-size: 12px; color: #999; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;">Share brief with artist</p>
      <div style="display: flex; gap: 8px;">
        <input style="flex:1; padding: 8px 12px; font-size: 13px; border: 1px solid #e0e0e0; border-radius: 8px; color: #555;" type="text" value="${briefLink}" readonly id="brief-link-input" />
        <button onclick="copyBriefLink()" style="padding: 8px 16px; background: #1a1a1a; color: white; border: none; border-radius: 8px; font-size: 13px; cursor: pointer;" id="copy-brief-btn">Copy</button>
      </div>
    </div>
  `;
  list.parentNode.appendChild(briefLinkBox);

  document.getElementById('brief-thinking').style.display    = 'none';
  document.getElementById('brief-output-list').style.display = 'block';

  // Show email capture after 3 seconds
  setTimeout(function() {
    showEmailCapture();
  }, 3000);
}

function showEmailCapture() {
  document.getElementById('state-email').style.display = 'block';
  document.getElementById('state-email').scrollIntoView({ behavior: 'smooth' });
}

function copyBriefLink() {
  const link = document.getElementById('brief-link-input').value;
  navigator.clipboard.writeText(link).then(function() {
    document.getElementById('copy-brief-btn').textContent = 'Copied!';
    setTimeout(function() {
      document.getElementById('copy-brief-btn').textContent = 'Copy';
    }, 2000);
  });
}


// ============================================================
// START OVER
// ============================================================

document.getElementById('start-over-btn').addEventListener('click', function() {
  document.getElementById('feedback-input').value = '';
  selectedAnswer = '';
  clientFeedback = '';
  showState('state-feedback');
});
// ============================================================
// EMAIL CAPTURE — State 4
// ============================================================

document.getElementById('capture-submit-btn').addEventListener('click', async function() {

  const email = document.getElementById('capture-email').value.trim();

  if (!email) {
    alert('Please enter your email.');
    return;
  }

  const btn       = document.getElementById('capture-submit-btn');
  btn.textContent = 'Saving...';
  btn.disabled    = true;

  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/leads`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey':        SUPABASE_KEY,
          'Content-Type':  'application/json',
          'Prefer':        'return=representation'
        },
        body: JSON.stringify({ email: email })
      }
    );
  } catch (error) {
    console.error('Lead capture error:', error);
  }

  document.getElementById('email-capture-box') ;
  document.querySelector('.email-capture-box').innerHTML = `
    <p class="email-capture-success">✓ You're on the list. We'll be in touch!</p>
    <p style="font-size: 13px; color: #aaa; margin-top: 0.5rem;">
      <a href="signup.html" style="color: #1a1a1a; font-weight: 500;">Create a free account now →</a>
    </p>
  `;
});

document.getElementById('capture-skip-btn').addEventListener('click', function() {
  document.getElementById('state-email').style.display = 'none';
});