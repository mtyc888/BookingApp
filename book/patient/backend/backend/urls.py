from django.contrib import admin
from django.urls import path
from . import views, book_appointment


urlpatterns = [
    path('all_branches', views.all_branches , name='all_branches'),
    path('all_services', views.all_services , name='all_services'),


    path('get_all_slots', book_appointment.get_all_slots , name='get_all_slots'),
    path('insert_appointment_slots', book_appointment.insert_appointment_slots , name='insert_appointment_slots'),
    path('get_appointments', book_appointment.get_appointments , name='get_appointments'),
    path('add_appointment', book_appointment.add_appointment , name='add_appointment'),
    path('reschedule_appointment', book_appointment.reschedule_appointment , name='reschedule_appointment'),
    path('validate_cancellation_token', book_appointment.validate_cancellation_token , name='validate_cancellation_token'),
    path('cancel_appointment', book_appointment.cancel_appointment , name='cancel_appointment'),
    path('validate_booking_reference', book_appointment.validate_booking_reference , name='validate_booking_reference'),
    path('create-checkout-session', views.stripe_checkout, name='Create checkout session'),
    path('stripe_webhook', views.stripe_webhook , name='stripe_webhook'),
    
]
