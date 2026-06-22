// ============================================================
// LIVE PREVIEW — updates the right side as the artist types
// ============================================================

const projectNameInput = document.getElementById('project-name');
const clientNameInput  = document.getElementById('client-name');
const artistNoteInput  = document.getElementById('artist-note');

const previewProjectName = document.getElementById('preview-project-name');
const previewClientName  = document.getElementById('preview-client-name');
const previewNote        = document.getElementById('preview-note');

// As the artist types in the project name field, update the preview
projectNameInput.addEventListener('input', function() {
  previewProjectName.textContent = this.value || 'Project name';
});

// Same for client name
clientNameInput.addEventListener('input', function() {
  previewClientName.textContent = this.value || 'Client name';
});

// Same for note
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

// When a file is chosen via the browse button
fileInput.addEventListener('change', function() {
  if (this.files && this.files[0]) {
    handleFile(this.files[0]);
  }
});

// Drag and drop support
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

// The main function that processes a selected file
function handleFile(file) {
  // Show the file name and remove button
  fileName.textContent = file.name;
  dropzone.style.display  = 'none';
  fileSelected.style.display = 'flex';

  // Show the preview on the right side
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

// Remove button resets everything back
fileRemove.addEventListener('click', function() {
  fileInput.value = '';
  dropzone.style.display     = 'block';
  fileSelected.style.display = 'none';
  previewEmpty.style.display  = 'flex';
  previewFilled.style.display = 'none';
  previewImage.src = '';
  previewVideo.src = '';
});