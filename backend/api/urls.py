from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    RegisterView, ProfileView, LogoutView,
    AgenciaViewSet, DireccionViewSet, AgenteViewSet,
    ClienteViewSet, AseguradoraViewSet, PlanViewSet,
    EstadoPolizaViewSet, PolizaViewSet, NotaViewSet, HistorialPolizaViewSet,
    EtiquetaViewSet, DocumentoViewSet, TareaViewSet, UserManagementViewSet,
    ZipCodeLookupView, CitaViewSet, MedicoViewSet, RecordatorioViewSet,
    ReporteAgentesView, DashboardStatsView, ReporteIntentosFallidosView
)

router = DefaultRouter()
router.register(r'users', UserManagementViewSet)
router.register(r'agencias', AgenciaViewSet)
router.register(r'direcciones', DireccionViewSet)
router.register(r'agentes', AgenteViewSet)
router.register(r'clientes', ClienteViewSet)
router.register(r'aseguradoras', AseguradoraViewSet)
router.register(r'planes', PlanViewSet)
router.register(r'estados-poliza', EstadoPolizaViewSet)
router.register(r'polizas', PolizaViewSet, basename='poliza')
router.register(r'notas', NotaViewSet)
router.register(r'historial', HistorialPolizaViewSet)
router.register(r'etiquetas', EtiquetaViewSet)
router.register(r'documentos', DocumentoViewSet)
router.register(r'tareas', TareaViewSet)
router.register(r'recordatorios', RecordatorioViewSet)
router.register(r'citas', CitaViewSet)
router.register(r'medicos', MedicoViewSet)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('utils/zipcode/<str:zip_code>/', ZipCodeLookupView.as_view(), name='zipcode-lookup'),
    path('reportes/agentes-facturacion/', ReporteAgentesView.as_view(), name='reporte-agentes'),
    path('reportes/intentos-fallidos/', ReporteIntentosFallidosView.as_view(), name='reporte-intentos-fallidos'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('', include(router.urls)),
]

