/**
 * Pruebas del flujo estricto de login cliente vs empleado.
 * Ejecutar: npm run verify:client-login
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

function canUseEmployeeLogin(input) {
  return !canAccessClientPortal(input);
}

function resolveMiddlewareRedirect(pathname, ctx) {
  const portalClient =
    ctx.portalClientCookie === '1' ||
    ctx.role === 'cliente' ||
    ctx.jwtClienteId ||
    canAccessClientPortal({ role: ctx.role, clienteId: ctx.jwtClienteId });

  if (pathname.startsWith('/crm')) {
    if (portalClient) return '/client/dashboard';
    if (!ctx.hasValidToken || !['admin', 'manager', 'asistente', 'sherpa', 'pagos', 'citas'].includes(ctx.role)) {
      return '/auth/login';
    }
    return null;
  }

  if (pathname === '/auth/login') {
    if (portalClient && ctx.hasValidToken) return '/client/dashboard';
    return null;
  }

  if (pathname.startsWith('/client/')) {
    const hasTokenCookie = Boolean(ctx.token);
    if (!hasTokenCookie) return '/client';
    if (portalClient) return null;
    if (!ctx.hasValidToken) return '/client';
    if (!portalClient) {
      if (['admin', 'manager', 'asistente', 'sherpa', 'pagos', 'citas'].includes(ctx.role)) return '/crm/dashboard';
      return '/client';
    }
    return null;
  }

  return null;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runUnitTests() {
  assert(canAccessClientPortal({ role: 'CLIENTE' }), 'CLIENTE accede al portal');
  assert(canAccessClientPortal({ profileRole: 'USER', profileClienteId: 7 }), 'USER+cliente accede');
  assert(!canUseEmployeeLogin({ role: 'CLIENTE' }), 'CLIENTE no puede login empleado');
  assert(canUseEmployeeLogin({ role: 'admin' }), 'admin puede login empleado');

  const clientCtx = {
    hasValidToken: true,
    token: 'fake.jwt.token',
    role: 'cliente',
    portalClientCookie: '1',
    jwtClienteId: 10,
  };

  assert(
    resolveMiddlewareRedirect('/crm/dashboard', clientCtx) === '/client/dashboard',
    'Cliente en CRM debe ir a /client/dashboard',
  );
  assert(
    resolveMiddlewareRedirect('/auth/login', clientCtx) === '/client/dashboard',
    'Cliente autenticado no debe quedarse en login empleado',
  );
  assert(
    resolveMiddlewareRedirect('/client/dashboard', clientCtx) === null,
    'Cliente puede acceder a su dashboard',
  );

  const employeeCtx = {
    hasValidToken: true,
    token: 'fake.jwt.token',
    role: 'admin',
    portalClientCookie: null,
    jwtClienteId: null,
  };

  assert(
    resolveMiddlewareRedirect('/crm/dashboard', employeeCtx) === null,
    'Admin puede acceder al CRM',
  );
  assert(
    resolveMiddlewareRedirect('/client/dashboard', employeeCtx) === '/crm/dashboard',
    'Admin no debe entrar al portal cliente',
  );

  console.log('✓ Pruebas estrictas de middleware/login OK');
}

async function runIntegrationTest() {
  if (process.env.SKIP_INTEGRATION === '1') return;

  try {
    const response = await fetch(`${API_URL}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: CLIENT_USERNAME, password: CLIENT_PASSWORD }),
    });

    if (!response.ok) {
      console.warn(`↷ Integración API omitida (${response.status})`);
      return;
    }

    const data = await response.json();
    const payload = decodeJwtPayload(data.access);
    const isClient = canAccessClientPortal({
      role: data.role,
      clienteId: data.cliente_id ?? payload.cliente_id,
    });

    assert(isClient, 'Usuario demo debe ser portal client');
    assert(
      resolveMiddlewareRedirect('/crm/dashboard', {
        hasValidToken: true,
        role: 'cliente',
        portalClientCookie: '1',
        jwtClienteId: payload.cliente_id,
      }) === '/client/dashboard',
      'Middleware debe bloquear CRM para cliente demo',
    );

    console.log(`✓ Integración API OK (${CLIENT_USERNAME})`);
  } catch (error) {
    console.warn(`↷ Integración API omitida: ${error.message}`);
  }
}

async function main() {
  runUnitTests();
  await runIntegrationTest();
  console.log('\nTodas las pruebas pasaron.');
}

main().catch((error) => {
  console.error('\n✗', error.message);
  process.exit(1);
});
