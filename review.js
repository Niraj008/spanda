// ============================================================
// SPANDA REVIEW PAGE
// This file controls the 3-state feedback flow:
// State 1 → Client writes feedback
// State 2 → Spanda asks a clarifying question (AI)
// State 3 → Spanda generates revision brief (AI)
// ============================================================


// ============================================================
// LOAD PROJECT DATA
// For now we use demo data. Later this will come from Supabase.
// ============================================================

const project = {
  name:   "Nike Ad — Final Cut v2",
  client: "Nike",
  note:   "Focus on the third act. The opening is locked."
};

document.getElementById('review-project-name').textContent = project.name;
document.getElementById('review-client-name').textContent  = project.client;

if (project.note) {
  document.getElementById('artist-note-text').textContent = project.note;
  document.getElementById('artist-note-box').style.display = 'block';
}


// ============================================================
// STATE MANAGEMENT
// Only one state is visible at a time.
// This function hides all states then shows the one you want.
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

let clientFeedback  = '';
let selectedAnswer  = '';

document.getElementById('submit-feedback-btn').addEventListener('click', async function() {

  const input = document.getElementById('feedback-input').value.trim();

  if (!input) {
    alert('Please write some feedback first.');
    return;
  }

  clientFeedback = input;

  // Show the client's original feedback in state 2
  document.getElementById('original-feedback-display').textContent = clientFeedback;

  // Move to state 2
  showState('state-question');

  // Ask the AI for a clarifying question
  await askClarifyingQuestion(clientFeedback);
});


// ============================================================
// ASK AI FOR A CLARIFYING QUESTION
// Sends the client's feedback to Claude.
// Claude returns a question + options in JSON format.
// ============================================================

async function askClarifyingQuestion(feedback) {

  // Show the thinking animation
  document.getElementById('ai-thinking').style.display        = 'flex';
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
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data   = await response.json();
    const text   = data.content[0].text;
    const parsed = JSON.parse(text);

    displayClarifyingQuestion(parsed.question, parsed.options);

  } catch (error) {
    // If AI fails, fall back to a sensible default
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
      // Deselect all options
      document.querySelectorAll('.ai-option').forEach(function(b) {
        b.classList.remove('selected');
      });
      // Select this one
      btn.classList.add('selected');
      selectedAnswer = optionText;

      // Show the generate brief button
      document.getElementById('submit-answer-btn').style.display = 'block';
    });

    container.appendChild(btn);
  });

  // Hide thinking, show question
  document.getElementById('ai-thinking').style.display         = 'none';
  document.getElementById('ai-question-content').style.display = 'block';
}


// ============================================================
// STATE 2 → STATE 3
// Client picks an answer → Spanda generates revision brief
// ============================================================

document.getElementById('submit-answer-btn').addEventListener('click', async function() {
  showState('state-brief');
  await generateRevisionBrief(clientFeedback, selectedAnswer);
});


// ============================================================
// GENERATE REVISION BRIEF
// Sends feedback + answer to Claude.
// Claude returns a list of actionable revision tasks.
// ============================================================

async function generateRevisionBrief(feedback, answer) {

  document.getElementById('brief-thinking').style.display     = 'flex';
  document.getElementById('brief-output-list').style.display  = 'none';

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
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data   = await response.json();
    const text   = data.content[0].text;
    const parsed = JSON.parse(text);

    displayRevisionBrief(parsed.tasks);

  } catch (error) {
    displayRevisionBrief([
      "Review the pacing of the sequence",
      "Adjust the edit rhythm to match the intended energy",
      "Check audio levels and music timing"
    ]);
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

  document.getElementById('brief-thinking').style.display    = 'none';
  document.getElementById('brief-output-list').style.display = 'block';
}


// ============================================================
// START OVER
// Reset everything back to state 1
// ============================================================

document.getElementById('start-over-btn').addEventListener('click', function() {
  document.getElementById('feedback-input').value = '';
  selectedAnswer = '';
  clientFeedback = '';
  showState('state-feedback');
});