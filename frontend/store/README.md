# Stores de Zustand - Bhealth Insurance

Este documento explica la estructura de los stores de Zustand implementados en el proyecto.

## 📁 Estructura de Stores

```
store/
├── authStore.ts      # Manejo de autenticación
├── uiStore.ts        # Manejo de estados de UI
├── polizaStore.ts    # Gestión de pólizas
├── tareaStore.ts     # Gestión de tareas
├── catalogoStore.ts  # Catálogos (agencias, planes, etc)
└── index.ts          # Exportaciones centralizadas
```

---

## 🔐 AuthStore

Store para manejar toda la lógica de autenticación del usuario.

### Estado

```typescript
{
  user: User | null;                 // Información del usuario autenticado
  accessToken: string | null;        // Token JWT de acceso
  refreshToken: string | null;       // Token JWT de refresco
  isAuthenticated: boolean;          // Estado de autenticación
  isLoading: boolean;                // Estado de carga
  error: string | null;              // Mensajes de error
}
```

### Acciones

- **`login(data: LoginData)`**: Inicia sesión y obtiene tokens JWT
- **`register(data: RegisterData)`**: Registra un nuevo usuario y hace login automático
- **`logout()`**: Cierra sesión y limpia tokens
- **`refreshAccessToken()`**: Refresca el token de acceso
- **`getProfile()`**: Obtiene el perfil del usuario autenticado
- **`setError(error: string | null)`**: Establece un mensaje de error
- **`clearError()`**: Limpia el mensaje de error

### Persistencia

El authStore persiste automáticamente en `localStorage` los siguientes campos:
- `accessToken`
- `refreshToken`
- `user`
- `isAuthenticated`

### Uso

```typescript
import { useAuthStore } from '@/store';

function MyComponent() {
  const { user, login, logout, isAuthenticated, isLoading } = useAuthStore();

  const handleLogin = async () => {
    try {
      await login({ username: 'user@email.com', password: 'password123' });
      // Usuario autenticado exitosamente
    } catch (error) {
      // Error manejado por el store
      console.error(error);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Bienvenido {user?.first_name}</p>
          <button onClick={logout}>Cerrar sesión</button>
        </>
      ) : (
        <button onClick={handleLogin}>Iniciar sesión</button>
      )}
    </div>
  );
}
```

---

## 📋 PolizaStore

Store para gestionar las pólizas de seguro del sistema.

### Estado

```typescript
{
  polizas: PolizaListResponse[];           // Lista de pólizas
  polizaSeleccionada: PolizaResponse | null; // Póliza seleccionada
  isLoading: boolean;                      // Cargando lista
  isCreating: boolean;                     // Creando póliza
  isUpdating: boolean;                     // Actualizando póliza
  isDeleting: boolean;                     // Eliminando póliza
  error: string | null;                    // Errores
  searchQuery: string;                     // Búsqueda
  filtros: {...};                          // Filtros activos
  page: number;                            // Paginación
  pageSize: number;
  totalPolizas: number;
}
```

### Acciones Principales

- **`fetchPolizas()`**: Obtener todas las pólizas
- **`fetchPolizaById(id)`**: Obtener póliza específica
- **`createPoliza(data)`**: Crear nueva póliza
- **`updatePoliza(id, data)`**: Actualizar póliza
- **`deletePoliza(id)`**: Eliminar póliza
- **`downloadDocuments(id)`**: Descargar documentos de póliza
- **`setFiltros(filtros)`**: Aplicar filtros
- **`setSearchQuery(query)`**: Búsqueda de texto

### Uso

```typescript
import { usePolizaStore } from '@/store';

function PolizasPage() {
  const { polizas, fetchPolizas, isLoading } = usePolizaStore();

  useEffect(() => {
    fetchPolizas();
  }, []);

  return (
    <div>
      {isLoading ? 'Cargando...' : (
        polizas.map(poliza => (
          <div key={poliza.id}>{poliza.plan_nombre}</div>
        ))
      )}
    </div>
  );
}
```

---

## ✅ TareaStore

Store para gestionar tareas y recordatorios del sistema.

### Estado

```typescript
{
  tareas: Tarea[];                  // Todas las tareas
  misTareas: Tarea[];               // Tareas asignadas al usuario
  tareaSeleccionada: Tarea | null;  // Tarea seleccionada
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  filtros: {...};
  vistaActual: 'todas' | 'mis-tareas' | 'pendientes' | 'completadas';
}
```

### Acciones Principales

- **`fetchTareas()`**: Obtener todas las tareas
- **`fetchMisTareas()`**: Obtener mis tareas
- **`createTarea(data)`**: Crear nueva tarea
- **`updateTarea(id, data)`**: Actualizar tarea
- **`deleteTarea(id)`**: Eliminar tarea
- **`completarTarea(id, notas?)`**: Marcar tarea como completada
- **`reabrirTarea(id)`**: Reabrir tarea completada
- **`setVistaActual(vista)`**: Cambiar vista (auto-carga datos)

### Uso

```typescript
import { useTareaStore } from '@/store';

function TareasPage() {
  const { 
    misTareas, 
    fetchMisTareas, 
    completarTarea,
    isLoading 
  } = useTareaStore();

  useEffect(() => {
    fetchMisTareas();
  }, []);

  const handleComplete = async (id: number) => {
    await completarTarea(id, 'Tarea completada exitosamente');
  };

  return (
    <div>
      {misTareas.map(tarea => (
        <div key={tarea.id}>
          {tarea.titulo}
          {!tarea.completada && (
            <button onClick={() => handleComplete(tarea.id)}>
              Completar
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 📚 CatalogoStore

Store para gestionar catálogos del sistema (agencias, agentes, aseguradoras, planes, estados).

### Estado

```typescript
{
  agencias: Agencia[];
  agentes: Agente[];
  aseguradoras: Aseguradora[];
  planes: Plan[];
  estadosPoliza: EstadoPoliza[];
  
  // Estados de carga individuales
  isLoadingAgencias: boolean;
  isLoadingAgentes: boolean;
  isLoadingAseguradoras: boolean;
  isLoadingPlanes: boolean;
  isLoadingEstados: boolean;
  
  error: string | null;
  
  // Control de carga inicial
  catalogosLoaded: {
    agencias: boolean;
    agentes: boolean;
    aseguradoras: boolean;
    planes: boolean;
    estados: boolean;
  };
}
```

### Acciones Principales

- **`fetchAgencias()`**: Cargar agencias
- **`fetchAgentes()`**: Cargar agentes
- **`fetchAseguradoras()`**: Cargar aseguradoras
- **`fetchPlanes()`**: Cargar planes
- **`fetchEstadosPoliza()`**: Cargar estados de póliza
- **`fetchAllCatalogos()`**: Cargar todos en paralelo
- **`getAgenciaById(id)`**: Buscar agencia por ID
- **`getPlanesActivos()`**: Obtener solo planes activos
- **`getPlanesByAseguradora(id)`**: Filtrar planes por aseguradora
- **`invalidateCatalogos()`**: Forzar recarga de catálogos

### Persistencia

Los catálogos se **persisten en localStorage** para mejor rendimiento. Se recargan solo cuando:
- El usuario cierra sesión
- Se llama a `invalidateCatalogos()`
- Se limpia el localStorage

### Uso

```typescript
import { useCatalogoStore } from '@/store';

function CreatePolizaForm() {
  const { 
    planes, 
    aseguradoras, 
    fetchAllCatalogos,
    catalogosLoaded 
  } = useCatalogoStore();

  useEffect(() => {
    // Solo cargar si no están en cache
    if (!catalogosLoaded.planes || !catalogosLoaded.aseguradoras) {
      fetchAllCatalogos();
    }
  }, []);

  return (
    <select>
      {planes.map(plan => (
        <option key={plan.id} value={plan.id}>
          {plan.nombre}
        </option>
      ))}
    </select>
  );
}
```

---

## 🎨 UIStore

Store para manejar estados de la interfaz de usuario.

### Estado

```typescript
{
  activeTabIndex: number;           // Índice del tab activo
  isSidebarOpen: boolean;           // Estado del sidebar
  isModalOpen: boolean;             // Estado de modal
  modalType: string | null;         // Tipo de modal abierto
  isPageLoading: boolean;           // Estado de carga de página
}
```

### Acciones

- **`setActiveTabIndex(index: number)`**: Cambia el tab activo
- **`toggleSidebar()`**: Alterna el estado del sidebar
- **`setSidebarOpen(isOpen: boolean)`**: Abre/cierra el sidebar
- **`openModal(type: string)`**: Abre un modal específico
- **`closeModal()`**: Cierra el modal activo
- **`setPageLoading(isLoading: boolean)`**: Establece el estado de carga
- **`reset()`**: Resetea todos los estados a valores iniciales

### Uso

```typescript
import { useUIStore } from '@/store';

function MyComponent() {
  const { activeTabIndex, setActiveTabIndex, openModal } = useUIStore();

  return (
    <div>
      <TabGroup 
        selectedIndex={activeTabIndex}
        onChange={setActiveTabIndex}
      >
        {/* Tabs */}
      </TabGroup>
      
      <button onClick={() => openModal('createPolicy')}>
        Crear Póliza
      </button>
    </div>
  );
}
```

## 🔧 DevTools

Todos los stores están configurados con **Redux DevTools** para debugging:

1. Instala [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools)
2. Abre las DevTools del navegador
3. Ve a la pestaña "Redux"
4. Inspecciona el estado y acciones de cada store

## 📝 Mejores Prácticas

### 1. Selectores específicos

Evita suscribirte a todo el store. Solo selecciona lo que necesitas:

```typescript
// ❌ Malo - se re-renderiza con cualquier cambio
const store = useAuthStore();

// ✅ Bueno - solo se re-renderiza cuando cambia `user`
const user = useAuthStore((state) => state.user);
```

### 2. Acciones separadas del estado

```typescript
// ✅ Bueno - separar estado de acciones
const user = useAuthStore((state) => state.user);
const login = useAuthStore((state) => state.login);
const logout = useAuthStore((state) => state.logout);
```

### 3. Manejo de errores

Los stores ya manejan errores internamente, pero siempre valida:

```typescript
const { login, error } = useAuthStore();

const handleLogin = async (data) => {
  try {
    await login(data);
    router.push('/dashboard');
  } catch (err) {
    // El error ya está en el store
    console.error('Login falló:', error);
  }
};
```

## 🚀 Próximos Stores a Crear

A medida que el proyecto crezca, considera crear:

- **`clientStore.ts`**: Para datos de clientes y perfiles
- **`notificationStore.ts`**: Para notificaciones en tiempo real
- **`formStore.ts`**: Para estados de formularios complejos
- **`searchStore.ts`**: Para búsquedas y filtros avanzados
- **`documentoStore.ts`**: Para gestión de documentos y archivos

---

## 🔄 Guía de Refactorización - Componentes Client

### Componentes a Refactorizar

#### 1. [`app/client/page.tsx`](../app/client/page.tsx) ✅ YA REFACTORIZADO
- **Store usado**: `useAuthStore`, `useUIStore`
- **Cambios aplicados**: 
  - Login y registro ahora usan `authStore`
  - Tab activo usa `uiStore`
  
#### 2. [`app/client/[clientId]/profile/page.tsx`](../app/client/[clientId]/profile/page.tsx)
- **Stores a usar**: `useAuthStore`, `usePolizaStore`
- **Refactorizaciones necesarias**:
  ```typescript
  // ❌ Antes (mock data con useState)
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [policy, setPolicy] = useState<PolicyInfo | null>(null);
  
  // ✅ Después (usar stores)
  const { user, updateProfile } = useAuthStore();
  const { polizas, fetchPolizas } = usePolizaStore();
  ```

#### 3. [`components/client/ClientPolicyInfo.tsx`](../components/client/ClientPolicyInfo.tsx)
- **Store a usar**: `usePolizaStore`
- **Refactorizaciones**:
  ```typescript
  // Obtener pólizas del usuario desde el store
  const { polizas, isLoading } = usePolizaStore();
  ```

#### 4. Componentes de Pólizas (cuando se creen)
- **`components/polizas/PolizasDataTable.tsx`**
  ```typescript
  const { 
    polizas, 
    fetchPolizas, 
    setFiltros, 
    searchQuery, 
    setSearchQuery 
  } = usePolizaStore();
  ```

- **`components/polizas/PolizasFilters.tsx`**
  ```typescript
  const { filtros, setFiltros, clearFiltros } = usePolizaStore();
  const { planes, aseguradoras, estadosPoliza } = useCatalogoStore();
  ```

### Patrón de Uso Recomendado

#### Cargar datos al montar el componente

```typescript
'use client';

import { useEffect } from 'react';
import { usePolizaStore, useCatalogoStore } from '@/store';

export default function PolizasPage() {
  const { polizas, fetchPolizas, isLoading } = usePolizaStore();
  const { fetchAllCatalogos } = useCatalogoStore();

  useEffect(() => {
    // Cargar datos en paralelo
    Promise.all([
      fetchPolizas(),
      fetchAllCatalogos()
    ]);
  }, []);

  if (isLoading) return <LoadingSpinner />;

  return <PolizasDataTable data={polizas} />;
}
```

#### Crear/Editar con optimistic updates

```typescript
const { createPoliza, isCreating } = usePolizaStore();

const handleSubmit = async (data: PolizaCreateRequest) => {
  try {
    await createPoliza(data);
    toast.success('Póliza creada exitosamente');
    router.push('/polizas');
  } catch (error) {
    toast.error('Error al crear póliza');
  }
};
```

#### Filtros y búsqueda

```typescript
const { setFiltros, setSearchQuery, clearFiltros } = usePolizaStore();

// Aplicar filtro
setFiltros({ estado: 1, aseguradora: 5 });

// Búsqueda
setSearchQuery('Plan Familiar');

// Limpiar todo
clearFiltros();
```

### Checklist de Refactorización

- [x] ✅ `authStore.ts` - Autenticación
- [x] ✅ `uiStore.ts` - UI global
- [x] ✅ `polizaStore.ts` - Pólizas
- [x] ✅ `tareaStore.ts` - Tareas
- [x] ✅ `catalogoStore.ts` - Catálogos
- [x] ✅ `app/client/page.tsx` - Login/Register
- [ ] 🔲 `app/client/[clientId]/profile/page.tsx` - Perfil cliente
- [ ] 🔲 `components/client/ClientPolicyInfo.tsx` - Info pólizas
- [ ] 🔲 `app/crm/polizas/*` - Gestión de pólizas CRM
- [ ] 🔲 `components/polizas/*` - Componentes de pólizas
- [ ] 🔲 Crear provider global para inicializar catálogos

---

## 📚 Referencias

- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Persist Middleware](https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md)
- [DevTools Middleware](https://github.com/pmndrs/zustand/blob/main/docs/guides/practice-with-no-store-actions.md)
