"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
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
from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('register', views.register_user, name='register'),
    path('login', views.login_user, name='login'),

    path('get_appointments', views.get_appointments, name='get_appointments'),
    path('get_appointment_form_by_id', views.get_appointment_form_by_id, name='get_appointment_form_by_id'),
    path('submit_appointment_form', views.submit_appointment_form, name='submit appointment info'),
    path('get_next_appointment', views.get_next_appointment, name='get next appointment'),
    path('set_next_appointment', views.set_next_appointment, name='set next appointment'),
    path('delete_appointment', views.delete_appointment, name='delete appointment'),

    path('get_patients', views.get_patients, name='get_patients'),
    path('get_patient_by_id', views.get_patient_by_id, name='get_patient_by_id'),

    path('get_services', views.get_services, name='get_services'),
    path('get_service_by_id', views.get_service_by_id, name='get_service_by_id'),
]
