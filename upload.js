// ============================================================
// SUPABASE SETUP
// ============================================================

const SUPABASE_URL = 'https://ryflnqxlahjjuofxjjor.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZmxucXhsYWhqanVvZnhqam9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMTU4NDcsImV4cCI6MjA5NzY5MTg0N30._vb7V1PA7kI-WJPrkptiRuyKRDDk5yJd5NKufWRNui4';


// ============================================================
// LIVE PREVIEW — updates the right side as the artist types
// ============================================================

const projectNameInput = document.getElementById('project-name');
const clientNameInput  = document.getElementById('client-name');
const artistNoteInput  = document.getElementById('artist-note');

const previewProjectName = document.getElementById('preview-project-name');
const previewClientName  = document.getElementById('preview-client-name');
const previewNote        = document.getElementById('preview-note');

projectNameInput.addEventListener('input', function() {
  previewProjectName.textContent = this.value || 'Project name';
});

clientNameInput.addEventListener('input', function() {
  previewClientName.textContent = this.value || 'Client name';
});

artistNoteInput.addEventListener('input', function() {
  previewNote.textContent = this.value;
});


// ============================================================
// FILE UPLOAD — handles file selection and preview
// ============================================================

const fileInput    = document.getElementById('file-input');
const dropzone     = document.getElementById('dropzone');
const fileSelected = document.getElementById('file-selected');
const fileName     = document.getElementById('file-name');
const fileRemove   = document.getElementById('file-remove');
const previewEmpty  = document.getElementById('preview-empty');
const previewFilled = document.getElementById('preview-filled');
const previewImage  = document.getElementById('preview-image');
const previewVideo  = document.getElementById('preview-video');

let selectedFile = null;

fileInput.addEventListener('change', function() {
  if (this.files && this.files[0]) {
    handleFile(this.files[0]);
  }
});

dropzone.addEventListener('dragover', function(e) {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', function() {
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', function(e) {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleFile(e.dataTransfer.files[0]);
  }
});

function handleFile(file) {
  selectedFile = file;
  fileName.textContent = file.name;
  dropzone.style.display     = 'none';
  fileSelected.style.display = 'flex';
  previewEmpty.style.display  = 'none';
  previewFilled.style.display = 'block';

  const fileURL = URL.createObjectURL(file);

  if (file.type.startsWith('image/')) {
    previewImage.src = fileURL;
    previewImage.style.display = 'block';
    previewVideo.style.display = 'none';
  } else if (file.type.startsWith('video/')) {
    previewVideo.src = fileURL;
    previewVideo.style.display = 'block';
    previewImage.style.display = 'none';
  }
}

fileRemove.addEventListener('click', function() {
  selectedFile = null;
  fileInput.value = '';
  dropzone.style.display     = 'block';
  fileSelected.style.display = 'none';
  previewEmpty.style.display  = 'flex';
  previewFilled.style.display = 'none';
  previewImage.src = '';
  previewVideo.src = '';
});


// ============================================================
// SUBMIT — saves project to Supabase and generates review link
// ============================================================

document.getElementById('submit-btn').addEventListener('click', async function() {

  const projectName = projectNameInput.value.trim();
  const clientName  = clientNameInput.value.trim();
  const artistNote  = artistNoteInput.value.trim();

  if (!projectName) { alert('Please enter a project name.'); return; }
  if (!clientName)  { alert('Please enter a client name.');  return; }
  if (!selectedFile) { alert('Please upload a file.');       return; }

  const btn = document.getElementById('submit-btn');
  btn.textContent = 'Uploading...';
  btn.disabled = true;

  try {

    // Step 1 — Upload file to Supabase Storage
    const fileExt      = selectedFile.name.split('.').pop();
    const fileNameUniq = `${Date.now()}.${fileExt}`;

    const uploadResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/project-files/${fileNameUniq}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': selectedFile.type
        },
        body: selectedFile
      }
    );

    if (!uploadResponse.ok) {
      throw new Error('File upload failed');
    }

    // Step 2 — Build the public file URL
    const fileURL = `${SUPABASE_URL}/storage/v1/object/public/project-files/${fileNameUniq}`;

    // Step 3 — Save project to database
    const projectResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/projects`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey':        SUPABASE_KEY,
          'Content-Type':  'application/json',
          'Prefer':        'return=representation'
        },
        body: JSON.stringify({
          project_name: projectName,
          client_name:  clientName,
          artist_note:  artistNote,
          file_url:     fileURL
        })
      }
    );

    if (!projectResponse.ok) {
      throw new Error('Project save failed');
    }

    const projectData = await projectResponse.json();
    const projectId   = projectData[0].id;

    // Step 4 — Show the shareable review link
    const reviewLink = `${window.location.origin}/review.html?project=${projectId}`;

    const submitArea = btn.parentNode;
    submitArea.innerHTML = `
      <div class="success-box">
        <p class="success-title">Project created!</p>
        <p class="success-subtitle">Share this link with your client:</p>
        <div class="share-row">
          <input class="share-input" type="text" value="${reviewLink}" readonly id="generated-link" />
          <button class="btn-copy" id="copy-link-btn">Copy</button>
        </div>
        <p class="success-hint">Anyone with this link can review the project and give feedback.</p>
      </div>
    `;

    document.getElementById('copy-link-btn').addEventListener('click', function() {
      navigator.clipboard.writeText(reviewLink).then(function() {
        document.getElementById('copy-link-btn').textContent = 'Copied!';
        setTimeout(function() {
          document.getElementById('copy-link-btn').textContent = 'Copy';
        }, 2000);
      });
    });

  } catch (error) {
    console.error(error);
    alert('Something went wrong. Please try again.');
    btn.textContent = 'Create project and get review link';
    btn.disabled = false;
  }

});