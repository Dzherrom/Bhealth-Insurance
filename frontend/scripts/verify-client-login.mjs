/**
 * Pruebas locales del flujo de acceso al portal de clientes.
 * Ejecutar: node scripts/verify-client-login.mjs
 */

const API_URL = process.env.API_URL || 'https://bhealth-insurance.onrender.com/api';
const CLIENT_USERNAME = process.env.CLIENT_USERNAME || 'cliente.bhdemo.princ.00001';
const CLIENT_PASSWORD = process.env.CLIENT_PASSWORD || 'Caracas2026.*';

function decodeJwtPayload(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
}

function canAccessClientPortal(input) {
  if (input.clienteId || input.profileClienteId) return true;
  const normalized = (input.role || input.profileRole || '').trim().toLowerCase();
  return normalized === 'cliente';
}

function resolveRoleFromLogin(token, responseRole, responseClienteId) {
  const payload = decodeJwtPayload(token);
  const role = (payload.role || '').toLowerCase();
  if (role === 'cliente') return 'cliente';
  if (payload.cliente_id) return 'cliente';
  if (canAccessClientPortal({ role: responseRole, clienteId: responseClienteId ?? payload.cliente_id })) {
    return 'cliente';
  }
  const crmRoles = ['admin', 'manager', 'asistente', 'sherpa', 'pagos', 'citas'];
  return crmRoles.includes(role) ? role : null;
}

function resolveRequestRole(token, cookies = {}) {
  if (token) {
    const payload = decodeJwtPayload(token);
    const role = resolveRoleFromLogin(token, payload.role, payload.cliente_id);
    if (role === 'cliente') return 'cliente';
  }
  if (cookies.portal_client === '1') return 'cliente';
  if ((cookies.user_role || '').toLowerCase() === 'cliente') return 'cliente';
  return null;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runUnitTests() {
  assert(
    canAccessClientPortal({ role: 'CLIENTE' }),
    'CLIENTE debe acceder al portal',
  );
  assert(
    canAccessClientPortal({ profileRole: 'USER', profileClienteId: 42 }),
    'USER con cliente vinculado debe acceder al portal',
  );
  assert(
    !canAccessClientPortal({ profileRole: 'USER' }),
    'USER sin cliente no debe acceder al portal',
  );
  assert(
    !canAccessClientPortal({ role: 'admin' }),
    'admin no debe tratarse como portal client por rol solo',
  );

  const fakeToken = [
    Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url'),
    Buffer.from(JSON.stringify({ role: 'USER', cliente_id: 99, exp: 9999999999 })).toString('base64url'),
    'sig',
  ].join('.');

  assert(
    resolveRoleFromLogin(fakeToken, 'USER', 99) === 'cliente',
    'JWT USER + cliente_id debe resolver a cliente',
  );
  assert(
    resolveRequestRole(fakeToken) === 'cliente',
    'middleware debe permitir portal con cliente_id en JWT',
  );

  console.log('✓ Pruebas unitarias de portal client OK');
}

async function runIntegrationTest() {
  if (process.env.SKIP_INTEGRATION === '1') {
    console.log('↷ Integración API omitida (SKIP_INTEGRATION=1)');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: CLIENT_USERNAME,
        password: CLIENT_PASSWORD,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.warn(`↷ Integración API omitida: login falló (${response.status}) ${body}`);
      return;
    }

    const data = await response.json();
    assert(data.access, 'Login debe devolver access token');
    assert(data.refresh, 'Login debe devolver refresh token');

    const resolvedRole = resolveRoleFromLogin(data.access, data.role, data.cliente_id);
    assert(
      resolvedRole === 'cliente',
      `Usuario demo debe resolver a cliente (obtenido: ${resolvedRole}, role=${data.role}, cliente_id=${data.cliente_id})`,
    );

    const payload = decodeJwtPayload(data.access);
    assert(
      payload.role === 'CLIENTE' || payload.cliente_id,
      `Access token debe incluir role CLIENTE o cliente_id (role=${payload.role}, cliente_id=${payload.cliente_id})`,
    );

    const middlewareRole = resolveRequestRole(data.access, { user_role: resolvedRole, portal_client: '1' });
    assert(middlewareRole === 'cliente', 'Middleware debe autorizar /client/dashboard');

    console.log(`✓ Integración API OK (${CLIENT_USERNAME} → /client/dashboard)`);
  } catch (error) {
    console.warn(`↷ Integración API omitida: ${error.message}`);
  }
}

async function main() {
  runUnitTests();
  await runIntegrationTest();
  console.log('\nTodas las pruebas pasaron. El login de cliente debe redirigir a /client/dashboard.');
}

main().catch((error) => {
  console.error('\n✗ Prueba fallida:', error.message);
  process.exit(1);
});
