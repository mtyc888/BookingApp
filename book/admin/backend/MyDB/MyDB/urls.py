"""
URL configuration for MyDB project.

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
from django.urls import path, re_path
from . import views
from django.urls import path, include
from .views import AllAppointment
from .views import send_appointment_email
from .views import reschedule_appointment
urlpatterns = [
    path('all', AllAppointment.as_view(), name='appointments'),
    path('get_services_with_appointment_count/', views.get_services_with_appointment_count, name='get_services_with_appointment_count'),
    path('get_services/', views.get_services, name='get_services'),
    path('get_branches/', views.get_branches, name='get_branches'),
    path('get_admins/', views.get_admins, name='get_admins'),
    path('get_dentists/', views.get_dentists, name='get_dentists'),  # New endpoint for fetching dentists
    path('get_appointments/', views.get_appointments, name='get_appointments'),
    path('get_patient/', views.get_patient, name='get_patient'),
    path('get_total_appointments_count/', views.get_total_appointments_count, name='get_total_appointments_count'),
    path('add_patient/', views.add_patient, name='add_patient'),
    path('add_appointment/', views.add_appointment, name='add_appointment'),  # New endpoint for adding appointment
    re_path(r'^delete_admin/(?P<admin_id>\d+)/$', views.delete_admin, name='delete_admin'),
    re_path(r'^delete_service/(?P<service_id>\d+)/$', views.delete_service, name='delete_service'),
    path('deactivate_service/<int:service_id>/', views.deactivate_service, name='deactivate_service'),
    path('add_service/', views.add_service, name='add_service'),
    path('tinymce/', include('tinymce.urls')),
    path('send_email/<int:patient_id>/', send_appointment_email, name="send_appointment_email"),
    path('save_template/', views.save_template, name='save_template'),
    path('api/book-appointment/', views.book_appointment, name='book_appointment'),
    path('api/appointment-slots/', views.get_available_slots, name='get_appointment_slots'),
    path('api/appointments/<str:booking_reference>/', views.get_appointment_by_reference, name='get-appointment-by-reference'),
    path('api/reschedule-slots/', views.get_reschedule_slots, name='get-reschedule-slots'),
    path('api/appointments-reschedule/', reschedule_appointment, name='reschedule_appointment'),
    path('api/get_all_appointment_slots/', views.get_all_appointment_slots, name='get_all_appointment_slots'),
]






