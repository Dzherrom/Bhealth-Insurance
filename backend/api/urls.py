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
    EstadoPolizaViewSet, PolizaViewSet, NotaViewSet
)

router = DefaultRouter()
router.register(r'agencias', AgenciaViewSet)
router.register(r'direcciones', DireccionViewSet)
router.register(r'agentes', AgenteViewSet)
router.register(r'clientes', ClienteViewSet)
router.register(r'aseguradoras', AseguradoraViewSet)
router.register(r'planes', PlanViewSet)
router.register(r'estados-poliza', EstadoPolizaViewSet)
router.register(r'polizas', PolizaViewSet)
router.register(r'notas', NotaViewSet)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('', include(router.urls)),
]

