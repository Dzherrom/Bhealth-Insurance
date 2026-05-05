# Análisis CRM - Stores Globales Creadas

## 📋 Resumen de Stores Creadas

Se han creado **4 nuevas stores** para gestionar el estado global del CRM:

### 1. **crmUsersStore.ts** - Gestión de Usuarios del CRM
**Propósito:** Administrar usuarios internos del sistema (admins, agentes, clientes)

**Estado gestionado:**
- ✅ Lista de usuarios con roles y estados
- ✅ Usuario seleccionado para edición
- ✅ Filtros avanzados (rol, estado, departamento, búsqueda)
- ✅ Paginación completa
- ✅ Estados de carga (CRUD operations)

**Funcionalidades:**
- `fetchUsers()` - Obtener todos los usuarios
- `fetchUserById(id)` - Obtener usuario específico
- `createUser(data)` - Crear nuevo usuario
- `updateUser(id, data)` - Actualizar usuario
- `deleteUser(id)` - Eliminar usuario
- `getFilteredUsers()` - Aplicar filtros de búsqueda
- Filtros: rol, estado, departamento, búsqueda por nombre/email

**Tipos principales:**
```typescript
CRMUser {
  id, name, email, phone, role, status, 
  avatar, lastLogin, createdAt, department
}
UserRole: 'admin' | 'agente' | 'cliente'
UserStatus: 'activo' | 'inactivo' | 'pendiente'
```

---

### 2. **formulariosFirmasStore.ts** - Gestión de Formularios de Firmas
**Propósito:** Administrar formularios digitales y procesos de firma

**Estado gestionado:**
- ✅ Lista de formularios con estados
- ✅ Formulario seleccionado con detalles completos
- ✅ Gestión de firmantes por formulario
- ✅ Campos personalizados del formulario
- ✅ Filtros y búsqueda
- ✅ Estadísticas agregadas

**Funcionalidades:**
- `fetchFormularios()` - Obtener todos los formularios
- `createFormulario(data)` - Crear nuevo formulario
- `updateFormulario(id, data)` - Actualizar formulario
- `deleteFormulario(id)` - Eliminar formulario
- `addFirmante(formularioId, firmante)` - Agregar firmante
- `updateFirmante(formularioId, firmanteId, data)` - Actualizar estado de firmante
- `duplicateFormulario(id)` - Duplicar formulario existente
- `getStats()` - Obtener estadísticas (activos, pendientes, validados, etc.)

**Tipos principales:**
```typescript
FormularioFirma {
  id, nombre, status, creadoPor, fechaCreacion,
  horaCreacion, total, descripcion, campos, firmantes
}
FormularioStatus: 'activo' | 'pendiente' | 'validado' | 'revisión'
Firmante {
  id, nombre, email, telefono, estado, fechaFirma
}
```

---

### 3. **configuracionesCRMStore.ts** - Configuraciones del CRM
**Propósito:** Gestionar configuraciones de la agencia/negocio

**Estado gestionado:**
- ✅ Información del negocio (nombre legal, comercial, contacto)
- ✅ Dirección del negocio
- ✅ Branding del portal (logos, colores, favicon)
- ✅ Estados personalizados de pólizas
- ✅ Configuración general del sistema
- ✅ **Persistencia en localStorage**

**Funcionalidades:**
- **Información del Negocio:**
  - `fetchInformacionNegocio()` - Cargar datos
  - `updateInformacionNegocio(data)` - Actualizar

- **Dirección:**
  - `fetchDireccionNegocio()` - Cargar dirección
  - `updateDireccionNegocio(data)` - Actualizar

- **Branding:**
  - `fetchBrandingPortal()` - Cargar branding
  - `updateBrandingPortal(data)` - Actualizar
  - `uploadLogo(file, tipo)` - Subir logo (claro/oscuro)
  - `uploadFavicon(file)` - Subir favicon

- **Estados de Póliza:**
  - `fetchEstadosPoliza()` - Cargar estados
  - `createEstadoPoliza(data)` - Crear estado personalizado
  - `updateEstadoPoliza(id, data)` - Actualizar estado
  - `deleteEstadoPoliza(id)` - Eliminar estado
  - `reorderEstadosPoliza(estadoId, newOrder)` - Reordenar

**Tipos principales:**
```typescript
InformacionNegocio {
  nombreLegal, nombreComercial, telefono,
  correoElectronico, sitioWeb, nif
}
DireccionNegocio {
  lineaDireccion1, lineaDireccion2, ciudad,
  estadoProvincia, codigoPostal, pais
}
BrandingPortal {
  logoModoClaro, logoModoOscuro, faviconPortal,
  tituloPortal, pieCorreosElectronicos,
  colorPrimario, colorSecundario
}
EstadoPoliza {
  id, nombre, color, descripcion, activo, orden
}
```

---

### 4. **dashboardStore.ts** - Dashboard y Estadísticas
**Propósito:** Centralizar métricas y actividades del dashboard

**Estado gestionado:**
- ✅ Estadísticas generales (usuarios, pólizas, ingresos, tareas)
- ✅ Actividades recientes en tiempo real
- ✅ Datos para gráficos (pólizas por estado, ingresos por mes)
- ✅ Tendencias y cambios porcentuales
- ✅ Filtros de periodo temporal

**Funcionalidades:**
- `fetchStats(periodo)` - Obtener estadísticas generales
- `fetchActividadesRecientes(limit)` - Actividad reciente
- `fetchPolizasPorEstado()` - Datos para gráfico de pólizas
- `fetchIngresosPorMes()` - Datos para gráfico de ingresos
- `fetchTendencias()` - Tendencias con porcentajes de cambio
- `addActividad(actividad)` - Agregar nueva actividad
- `setPeriodo(periodo)` - Cambiar periodo de análisis
- `refreshDashboard()` - Refrescar todos los datos

**Tipos principales:**
```typescript
DashboardStats {
  usuariosActivos, usuariosInactivos, candidatos,
  polizasActivas, polizasPendientes, polizasVencidas,
  ingresosMensuales, ingresosAnuales,
  tareasPendientes, tareasCompletadas,
  formulariosFirmasPendientes, clientesNuevos
}
ActividadReciente {
  id, tipo, titulo, descripcion, timestamp, usuario
}
TendenciaMetrica {
  valor, cambio (%), periodo
}
```

---

## 🎯 Componentes a Refactorizar

### **Prioridad Alta** (Mock data hardcodeado)

#### 1. **app/crm/users/page.tsx**
**Estado actual:** Mock data local con useState
**Refactorizar con:** `useCRMUsersStore`
**Cambios necesarios:**
- ❌ Eliminar: `const [users, setUsers] = useState<User[]>(mockUsers)`
- ✅ Implementar: `const { users, fetchUsers, filters, setFilters } = useCRMUsersStore()`
- ✅ Agregar: `useEffect(() => { fetchUsers() }, [])`
- ✅ Reemplazar filtros locales con `setFilters()`

#### 2. **app/crm/formularios-de-firmas/page.tsx**
**Estado actual:** Mock data local importado
**Refactorizar con:** `useFormulariosFirmasStore`
**Cambios necesarios:**
- ❌ Eliminar: Import de `mockFormulariosFirmas`
- ✅ Implementar: `const { formularios, fetchFormularios, getFilteredFormularios, getStats } = useFormulariosFirmasStore()`
- ✅ Usar: `getFilteredFormularios()` en lugar de filtrado manual
- ✅ Conectar: `FormulariosFirmasStats` con `getStats()`

#### 3. **app/crm/configuraciones/page.tsx**
**Estado actual:** Mock data local con useState
**Refactorizar con:** `useConfiguracionesCRMStore`
**Cambios necesarios:**
- ❌ Eliminar: `const [configuraciones, setConfiguraciones] = useState<ConfiguracionesData>(mockConfiguracionesData)`
- ✅ Implementar: Store completo con todas las secciones
- ✅ Agregar: Funcionalidad de guardado real
- ✅ Conectar: StatusList con `estadosPoliza` del store

#### 4. **app/crm/dashboard/page.tsx**
**Estado actual:** BoxComponents con valores hardcodeados
**Refactorizar con:** `useDashboardStore`
**Cambios necesarios:**
- ✅ Implementar: `const { stats, actividadesRecientes, fetchStats, fetchActividadesRecientes, refreshDashboard } = useDashboardStore()`
- ✅ Reemplazar: Valores estáticos con `stats?.usuariosActivos`, etc.
- ✅ Mejorar: Lista de actividades con datos reales del store
- ✅ Agregar: Auto-refresh con intervalos
- ✅ Agregar: Gráficos con datos de `polizasPorEstado` e `ingresosPorMes`

### **Prioridad Media** (Componentes presentacionales)

#### 5. **components/users/UsersList.tsx**
**Refactorizar:** Recibir datos del store a través de props desde page.tsx
**No requiere cambios directos en el componente**

#### 6. **components/formularios-de-firmas/FormulariosFirmasDataTable.tsx**
**Refactorizar:** Recibir datos del store
**Agregar:** Acciones para duplicar, eliminar desde el store

#### 7. **components/configuraciones/StatusList.tsx**
**Refactorizar:** Conectar con `useConfiguracionesCRMStore`
**Agregar:**
- CRUD completo de estados desde el store
- Funcionalidad de reordenar con drag & drop

### **Prioridad Baja** (Componentes de filtros - ya funcionan bien)

#### 8. **components/users/UsersFilters.tsx**
**Cambios menores:** Conectar `setFilters` del store en lugar de callbacks locales

#### 9. **components/formularios-de-firmas/FormulariosFirmasFilters.tsx**
**Cambios menores:** Usar `setFilters` del store

#### 10. **app/crm/polizas/page.tsx**
**Ya refactorizado:** ✅ Ya usa `usePolizaStore` (creado anteriormente)
**Acción:** Verificar integración completa

---

## 📊 Tabla de Refactorización

| Componente/Page | Store a Usar | Prioridad | Estado | Mock Data |
|----------------|--------------|-----------|--------|-----------|
| `app/crm/users/page.tsx` | `useCRMUsersStore` | 🔴 Alta | ⏳ Pendiente | Sí |
| `app/crm/formularios-de-firmas/page.tsx` | `useFormulariosFirmasStore` | 🔴 Alta | ⏳ Pendiente | Sí |
| `app/crm/configuraciones/page.tsx` | `useConfiguracionesCRMStore` | 🔴 Alta | ⏳ Pendiente | Sí |
| `app/crm/dashboard/page.tsx` | `useDashboardStore` | 🔴 Alta | ⏳ Pendiente | Sí |
| `app/crm/polizas/page.tsx` | `usePolizaStore` | 🟢 Baja | ✅ Hecho | No |
| `components/users/UsersList.tsx` | Props desde page | 🟡 Media | ⏳ Pendiente | - |
| `components/formularios-de-firmas/*` | Props desde page | 🟡 Media | ⏳ Pendiente | - |
| `components/configuraciones/StatusList.tsx` | `useConfiguracionesCRMStore` | 🟡 Media | ⏳ Pendiente | - |

---

## 🔧 Beneficios de las Stores

### ✅ **Centralización del Estado**
- Un único punto de verdad para cada dominio del CRM
- Eliminación de props drilling
- Estado compartido entre componentes

### ✅ **Persistencia**
- `configuracionesCRMStore` persiste en localStorage
- Datos de configuración disponibles al recargar

### ✅ **Optimización**
- Devtools de Zustand para debugging
- Re-renders optimizados
- Lazy loading de datos

### ✅ **Mantenibilidad**
- Lógica de negocio separada de la UI
- Fácil testeo de stores
- Tipado completo con TypeScript

### ✅ **Escalabilidad**
- Preparado para integración con API real
- TODOs marcados para endpoints
- Estructura extensible

---

## 🚀 Próximos Pasos Recomendados

1. **Refactorizar pages en orden de prioridad:**
   - `dashboard/page.tsx` → Impacto visual inmediato
   - `users/page.tsx` → Funcionalidad crítica
   - `formularios-de-firmas/page.tsx` → Workflows importantes
   - `configuraciones/page.tsx` → Settings del sistema

2. **Integración con API:**
   - Reemplazar mock data con llamadas reales
   - Implementar endpoints faltantes
   - Manejo de errores mejorado

3. **Testing:**
   - Tests unitarios de stores
   - Tests de integración con componentes
   - E2E tests de flujos críticos

4. **Optimizaciones:**
   - Implementar cache de requests
   - Optimistic updates
   - Real-time con WebSockets (actividades)

---

## 📝 Notas Técnicas

- **Todas las stores usan Zustand v5.0.9** con devtools
- **Middleware:** persist solo en `configuracionesCRMStore`
- **Mock data temporal** en todas las fetch functions (marcado con TODO)
- **TypeScript estricto** con interfaces completas
- **Naming convention:** Consistente con stores existentes (cliente)

---

**Stores creadas:** 4
**Líneas de código:** ~1,200
**Componentes a refactorizar:** 8
**Estado:** ✅ Listo para implementación
