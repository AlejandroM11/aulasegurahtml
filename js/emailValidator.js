const ALLOWED_DOMAINS = ['gmail.com','hotmail.com','outlook.com','yahoo.com','icloud.com','estudiantesunibague.edu.co'];

function isEduDomain(d){ return d.endsWith('.edu') || d.endsWith('.edu.co'); }

function isValidEmailDomain(email) {
  if (!email.includes('@')) return false;
  const domain = email.split('@')[1].toLowerCase();
  return ALLOWED_DOMAINS.includes(domain) || isEduDomain(domain);
}

function getEmailValidationError(email) {
  if (!email.includes('@')) return '❌ Correo inválido: falta el símbolo @.';
  const domain = email.split('@')[1].toLowerCase();
  return `❌ El dominio "${domain}" no está permitido.\n\nSolo se permiten:\n• Gmail\n• Hotmail\n• Outlook\n• Yahoo\n• iCloud\n• Cualquier correo .edu\n• estudiantesunibague.edu.co`;
}
