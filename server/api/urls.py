from django.urls import path

from api import views

"""zoobreak URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

app_name = 'api'

urlpatterns = [
    path(r'metadata/<int:token_id>/', views.get_metadata),
    path('ping/', views.ping),
    path('wallet/', views.get_wallet),
    path('wallet/tokens/', views.get_tokens),
    path('wallet/register/', views.register_wallet),
    path('wallet/register/update/', views.update_wallet),
    path('mint_request/', views.mint_request),
    path('withdraw_love/', views.withdraw_love),
    path('action/', views.action),
]
