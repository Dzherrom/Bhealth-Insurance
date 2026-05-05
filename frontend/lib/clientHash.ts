import crypto from 'crypto';

/**
 * Genera un hash único para el cliente basado en su información
 * @param clientData - Datos del cliente para generar el hash
 * @returns String hasheado único para el cliente
 */
export function generateClientHash(clientData: {
  email: string;
  firstName: string;
  lastName: string;
  timestamp?: number;
}): string {
  const { email, firstName, lastName, timestamp = Date.now() } = clientData;
  
  // Crear un string único combinando los datos del cliente
  const dataString = `${email}-${firstName}-${lastName}-${timestamp}`;
  
  // Generar hash SHA-256
  const hash = crypto.createHash('sha256').update(dataString).digest('hex');
  
  // Devolver los primeros 16 caracteres para un ID más manejable
  return hash.substring(0, 16);
}

/**
 * Valida si un hash de cliente tiene el formato correcto
 * @param hash - Hash a validar
 * @returns true si el formato es válido
 */
export function validateClientHash(hash: string): boolean {
  // El hash debe ser hexadecimal y tener 16 caracteres
  return /^[a-f0-9]{16}$/i.test(hash);
}

/**
 * Genera un hash temporal para demo/testing
 * @param email - Email del cliente
 * @returns Hash temporal para usar en desarrollo
 */
export function generateTempClientHash(email: string): string {
  const hash = crypto.createHash('md5').update(email + 'temp-salt').digest('hex');
  return hash.substring(0, 16);
}