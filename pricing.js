// ============================================================
// PRE-FILL EMAIL IN CHECKOUT LINKS
// If user is logged in, attach their email to the checkout URL
// so they don't have to type it again on Lemon Squeezy
// ============================================================

const session   = JSON.parse(localStorage.getItem('spanda_session'));
const userEmail = session?.user?.email || null;

if (userEmail) {
  document.querySelectorAll('.checkout-link').forEach(function(link) {
    const url = new URL(link.href);
    url.searchParams.set('checkout[email]', userEmail);
    link.href = url.toString();
  });
}


// ============================================================
// CURRENCY TOGGLE
// Switches between USD and INR pricing
// ============================================================

const btnIntl  = document.getElementById('btn-intl');
const btnIndia = document.getElementById('btn-india');

btnIntl.addEventListener('click', function() {
  btnIntl.classList.add('active');
  btnIndia.classList.remove('active');

  document.querySelectorAll('.intl-price').forEach(function(el) {
    el.style.display = 'inline';
  });
  document.querySelectorAll('.india-price').forEach(function(el) {
    el.style.display = 'none';
  });
});

btnIndia.addEventListener('click', function() {
  btnIndia.classList.add('active');
  btnIntl.classList.remove('active');

  document.querySelectorAll('.india-price').forEach(function(el) {
    el.style.display = 'inline';
  });
  document.querySelectorAll('.intl-price').forEach(function(el) {
    el.style.display = 'none';
  });
});


// ============================================================
// FAQ ACCORDION
// ============================================================

function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const icon   = btn.querySelector('.faq-icon');

  if (answer.style.display === 'none') {
    answer.style.display = 'block';
    icon.textContent     = '−';
  } else {
    answer.style.display = 'none';
    icon.textContent     = '+';
  }
}