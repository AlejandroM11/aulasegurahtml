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
