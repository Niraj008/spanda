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