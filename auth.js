// ============================================================
// SUPABASE SETUP
// ============================================================

const SUPABASE_URL = 'https://ryflnqxlahjjuofxjjor.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZmxucXhsYWhqanVvZnhqam9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMTU4NDcsImV4cCI6MjA5NzY5MTg0N30._vb7V1PA7kI-WJPrkptiRuyKRDDk5yJd5NKufWRNui4';


// ============================================================
// HELPER — show error message on page
// ============================================================

function showError(message) {
  const el = document.getElementById('auth-error');
  el.textContent = message;
  el.style.display = 'block';
}


// ============================================================
// HELPER — make a request to Supabase Auth
// ============================================================

async function supabaseAuth(endpoint, body) {
  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/${endpoint}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey':       SUPABASE_KEY
      },
      body: JSON.stringify(body)
    }
  );
  return response.json();
}


// ============================================================
// SIGN UP
// ============================================================

const signupBtn = document.getElementById('signup-btn');

if (signupBtn) {
  signupBtn.addEventListener('click', async function() {

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const fullName = document.getElementById('full-name').value.trim();

    if (!email)    { showError('Please enter your email.');    return; }
    if (!password) { showError('Please enter a password.');    return; }
    if (!fullName) { showError('Please enter your name.');     return; }
    if (password.length < 6) {
      showError('Password must be at least 6 characters.');
      return;
    }

    signupBtn.textContent = 'Creating account...';
    signupBtn.disabled    = true;

    const data = await supabaseAuth('signup', {
      email,
      password,
      data: { full_name: fullName }
    });

    if (data.error) {
      showError(data.error.message || 'Signup failed. Please try again.');
      signupBtn.textContent = 'Create account';
      signupBtn.disabled    = false;
      return;
    }

    // Save session to localStorage
    localStorage.setItem('spanda_session', JSON.stringify(data));

    // Redirect to dashboard
    window.location.href = 'dashboard.html';
  });
}


// ============================================================
// LOG IN
// ============================================================

const loginBtn = document.getElementById('login-btn');

if (loginBtn) {
  loginBtn.addEventListener('click', async function() {

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email)    { showError('Please enter your email.');    return; }
    if (!password) { showError('Please enter your password.'); return; }

    loginBtn.textContent = 'Logging in...';
    loginBtn.disabled    = true;

    const data = await supabaseAuth('token?grant_type=password', {
      email,
      password
    });

    if (data.error) {
      showError(data.error.message || 'Login failed. Please check your details.');
      loginBtn.textContent = 'Log in';
      loginBtn.disabled    = false;
      return;
    }

    // Save session to localStorage
    localStorage.setItem('spanda_session', JSON.stringify(data));

    // Redirect to dashboard
    window.location.href = 'dashboard.html';
  });
}