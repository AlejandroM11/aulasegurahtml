// ===== VALIDACIÓN DE DOMINIO DE CORREO =====

const ALLOWED_DOMAINS = [
  'gmail.com', 'hotmail.com', 'outlook.com',
  'yahoo.com', 'icloud.com', 'estudiantesunibague.edu.co'
];

function isEduDomain(domain) {
  return domain.endsWith('.edu') || domain.endsWith('.edu.co');
}

function isValidEmailDomain(email) {
  if (!email.includes('@')) return false;
  const domain = email.split('@')[1].toLowerCase();
  return ALLOWED_DOMAINS.includes(domain) || isEduDomain(domain);
}

function getEmailValidationError(email) {
  if (!email.includes('@')) return '❌ Correo inválido: falta el símbolo @.';
  const domain = email.split('@')[1].toLowerCase();
  return `❌ El dominio "${domain}" no está permitido.\n\nSolo se permiten:\n• Gmail, Hotmail, Outlook, Yahoo, iCloud\n• Cualquier correo .edu\n• estudiantesunibague.edu.co`;
}

function bindEmailValidation(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (!input || !error) return;

  input.addEventListener('input', () => {
    const email = input.value.trim();
    if (!email) {
      error.textContent = '';
      input.style.borderColor = '';
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      error.textContent = '❌ Escribe un correo válido';
      error.style.color = '#dc2626';
      input.style.borderColor = '#dc2626';
      return;
    }
    if (!isValidEmailDomain(email)) {
      error.textContent = '❌ Dominio no permitido. Usa Gmail, Hotmail, Outlook, Yahoo, iCloud o correo .edu';
      error.style.color = '#dc2626';
      input.style.borderColor = '#dc2626';
      return;
    }
    error.textContent = '✅ Correo válido';
    error.style.color = '#16a34a';
    input.style.borderColor = '#16a34a';
  });
}