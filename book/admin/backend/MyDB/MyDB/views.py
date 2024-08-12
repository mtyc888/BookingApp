from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest, HttpResponseNotFound
from django.contrib.auth.decorators import login_required
from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
from .serializers import AppointmentSerializer, EmailTemplateSerializer
from .models import Admin, Appointment, Patient, Service, Branch, EmailTemplate
from rest_framework import status, pagination
import json
import logging
import json
import re
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Service, Admin, AppointmentSlot, Appointment  
# Use caching if applicable
from django.views.decorators.cache import cache_page
from datetime import datetime
from datetime import timedelta
from datetime import datetime, date
from datetime import datetime, timedelta
from django.db.models import F, Q, Count


from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from google.cloud import dialogflow_v2 as dialogflow
from google.oauth2 import service_account
import json
import uuid
import os
from django.db import transaction
from django.utils import timezone
import pytz
from django.core.exceptions import ObjectDoesNotExist

# For sending email
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags


@api_view(['POST'])
def reschedule_appointment(request):
    data = request.data
    booking_reference = data.get('booking_reference')
    new_date_time_str = data.get('new_date_time')
    new_slots_taken = data.get('new_slots_taken')
    print("Received data for rescheduling:", request.data)
    if not booking_reference or not new_date_time_str or not new_slots_taken:
        return JsonResponse({"error": "Missing required fields"}, status=400)

    try:
        # Convert the new appointment date and time to a timezone-aware datetime
        new_date_time = datetime.strptime(new_date_time_str, "%Y-%m-%dT%H:%M:%S.%fZ")
        new_date_time = timezone.make_aware(new_date_time, timezone.get_default_timezone())

        with transaction.atomic():
            # Fetch the appointment using the booking reference
            appointment = Appointment.objects.get(booking_reference=booking_reference)

            # Release the old slots and assign new ones
            AppointmentSlot.objects.filter(id__in=appointment.slots_taken).update(is_available=True)
            AppointmentSlot.objects.filter(id__in=new_slots_taken).update(is_available=False)

            # Update the appointment
            appointment.appointment_datetime = new_date_time
            appointment.slots_taken = new_slots_taken
            appointment.save()

        return Response({"message": "Appointment rescheduled successfully"}, status=status.HTTP_200_OK)
    
    except Appointment.DoesNotExist:
        return JsonResponse({"error": "Appointment not found"}, status=404)
    except ValueError as e:
        return JsonResponse({"error": str(e)}, status=400)
    except Exception as e:
        # Log the error for server-side debugging
        print(str(e))
        return JsonResponse({"error": "An error occurred during rescheduling"}, status=500)


def calculate_end_time(start_time, duration_in_slots, slot_duration=timedelta(minutes=15)):
    # duration_in_slots is the number of 15-minute slots the appointment takes
    return (datetime.strptime(start_time, "%H:%M") + (duration_in_slots - 1) * slot_duration).time().strftime("%H:%M")

def find_consecutive_slots(all_slots, required_slots_count):
    # This function will find consecutive slots
    available_slots = []

    # Check for each slot if the following required_slots_count - 1 slots are consecutive
    for i in range(len(all_slots) - required_slots_count + 1):
        consecutive = True
        for j in range(1, required_slots_count):
            # Calculate the expected start time for the next slot
            expected_start_time = all_slots[i + j - 1].start_time + timedelta(minutes=15)
            if all_slots[i + j].start_time != expected_start_time:
                consecutive = False
                break
        if consecutive:
            available_slots.append(all_slots[i:i + required_slots_count])

    return available_slots

# Function to format datetime objects into strings
def format_time(dt):
    return dt.strftime("%I:%M%p")

# Function to retrieve the duration of a service from the Service model
def get_service_duration(service_id):
    service = Service.objects.get(id=service_id)
    # Convert TimeField to a timedelta for easier calculation
    return timedelta(hours=service.duration.hour, minutes=service.duration.minute)

# Function to find 15-minute slots in a given timeframe that fit the service duration
def find_matching_slots(start_time, end_time, duration):
    available_slots = []
    current_time = start_time

    # Loop over the timeframe in 15-minute increments
    while current_time + duration <= end_time:
        available_slots.append(current_time)
        current_time += timedelta(minutes=15)  # Move to the next 15-minute block

    return available_slots


def get_all_appointment_slots(request):
    # Retrieve all records from the appointment_slots table
    appointment_slots = AppointmentSlot.objects.all()

    # Prepare the response data
    response_data = []
    for slot in appointment_slots:
        response_data.append({
            "id": slot.id,
            "dentist_id": slot.dentist_id,
            "start_time": slot.start_time.strftime("%Y-%m-%d %H:%M:%S"),
            "end_time": slot.end_time.strftime("%Y-%m-%d %H:%M:%S"),
            "is_available": slot.is_available,
            "service_id": slot.service_id,
        })

    # Return the data as a JSON response
    return JsonResponse({"appointment_slots": response_data})

def get_available_slots(request):
    # Get parameters from the request
    date = request.GET.get('date')
    service_id = request.GET.get('service_id')  # Get the service ID from the request
    
    # Validate parameters
    if not date or not service_id:
        return JsonResponse({"error": "Missing date or service_id"}, status=400)

    try:
        # Convert the date string to a datetime object
        target_date = datetime.strptime(date, '%Y-%m-%d').date()

        # Get the service duration (in minutes)
        service = Service.objects.get(id=service_id)
        duration_in_minutes = service.duration.hour * 60 + service.duration.minute  # Convert to minutes

        # Calculate the number of 15-minute slots needed
        required_slots = duration_in_minutes // 15

        # Calculate the start and end of the day
        start_of_day = datetime.combine(target_date, datetime.min.time())
        end_of_day = datetime.combine(target_date, datetime.max.time())

        # Fetch all slots for the given date
        slots = AppointmentSlot.objects.filter(
            start_time__gte=start_of_day,
            start_time__lte=end_of_day,
            is_available=True
        ).order_by('start_time')

        # Find and group slots that match the service duration
        available_slots = []
        slots = list(slots)  # Convert queryset to list
        for i in range(len(slots) - required_slots + 1):
            consecutive_slots = slots[i:i + required_slots]
            if all(
                consecutive_slots[j].start_time == consecutive_slots[0].start_time + timedelta(minutes=j * 15)
                for j in range(required_slots)
            ):
                available_slots.append({
                    "id": [slot.id for slot in consecutive_slots],
                    "dentist_id": consecutive_slots[0].dentist_id,
                    "start_time": consecutive_slots[0].start_time.strftime("%H:%M"),
                    "end_time": consecutive_slots[-1].end_time.strftime("%H:%M"),
                    "is_available": True,
                    "service_id": service_id
                })

        # Prepare the response
        response_data = {
            "slots": available_slots
        }
        return JsonResponse(response_data)
    except Service.DoesNotExist:
        return JsonResponse({"error": "Service not found"}, status=404)
    except ValueError:
        return JsonResponse({"error": "Invalid date format"}, status=400)

@login_required
def dashboard(request):
    return JsonResponse({'message': 'Welcome to the dashboard!'})

@cache_page(60 * 15)  # Cache for 15 minutes
def get_admins(request):
    admins = Admin.objects.values('id', 'username', 'password', 'is_superuser')
    return JsonResponse({'admins': list(admins)})

@cache_page(60 * 15)
def get_appointments(request):
    appointments = Appointment.objects.only('id', 'patient_id', 'dentist_id', 'appointment_datetime', 'branch', 'reason', 'appointment_duration').order_by('-appointment_datetime')[:100]
    appointment_list = [{'id': appointment.id, 'patient_id': appointment.patient_id, 'dentist_id': appointment.dentist_id, 'appointment_datetime': appointment.appointment_datetime, 'branch': appointment.branch, 'reason': appointment.reason, 'appointment_duration': appointment.appointment_duration} for appointment in appointments]
    return JsonResponse({'appointments': appointment_list})

@cache_page(60 * 15)
def get_patient(request):
    patients = Patient.objects.values('id', 'full_name')
    return JsonResponse({'patients': list(patients)})

def get_total_appointments_count(request):
    total_count = Appointment.objects.count()
    return JsonResponse({'total_count': total_count})

@cache_page(60 * 15)
def get_services(request):
    services = Service.objects.values('name', 'id', 'duration', 'status')
    return JsonResponse({'services': list(services)})

@cache_page(60 * 15)
def get_branches(request):
    branches = Branch.objects.values('id', 'branch_name')
    return JsonResponse(list(branches), safe=False)

@cache_page(60 * 15)
def get_services_with_appointment_count(request):
    services = Appointment.objects.values('reason').annotate(appointment_count=Count('id'))
    return JsonResponse({'services': list(services)})

class AllAppointment(APIView, pagination.PageNumberPagination):
    permission_classes = [AllowAny,]
    page_size = 20

    def get(self, request):
        appointments = Appointment.objects.all()[:100]
        results = self.paginate_queryset(appointments, request)
        serializer = AppointmentSerializer(results, many=True)
        return self.get_paginated_response(serializer.data)

@api_view(['POST'])
def add_patient(request):
    data = request.data
    existing_patient = Patient.objects.filter(full_name=data.get('full_name')).first()
    if existing_patient:
        return Response({"error": "Entry already exists in the database!"}, status=400)

    patient = Patient(**data)
    patient.save()
    return Response({"id": patient.id})

from datetime import datetime, timezone as dt_timezone, timedelta

@api_view(['POST'])
def add_appointment(request):
    data = request.data
    print('data: ', data)
    # Parse and validate the incoming data
    try:
        patient_id = int(data.get('patient_id'))
        service_id = int(data.get('service_id'))
        dentist_id = int(data.get('dentist_id'))
        branch_id = int(data.get('branch_id'))
        reason = data.get('reason')
        appointment_datetime_str = data.get('appointment_datetime')
        appointment_duration_str = data.get('appointment_duration')
        status = data.get('status')
        branch = data.get('branch')
        slot_ids = [int(id) for id in data.get('slot_ids', [])]

        # Convert strings to datetime objects
        appointment_datetime = datetime.strptime(appointment_datetime_str, "%Y-%m-%dT%H:%M:%S.%fZ")
        appointment_datetime = appointment_datetime.replace(tzinfo=dt_timezone.utc)

        appointment_duration = datetime.strptime(appointment_duration_str, "%H:%M:%S").time()

        # Validate the appointment duration
        if appointment_duration.hour < 0 or appointment_duration.minute < 0:
            raise ValueError("Invalid appointment duration")

        # Validate the patient, service, and dentist IDs
        if not Service.objects.filter(id=service_id).exists():
            raise ValueError("Invalid service ID")
        if patient_id <= 0:
            raise ValueError("Invalid patient ID")
        if dentist_id <= 0:
            raise ValueError("Invalid dentist ID")

        with transaction.atomic():
            # Check and update the slots
            slots = AppointmentSlot.objects.filter(id__in=slot_ids, is_available=True)
            if slots.count() != len(slot_ids):
                raise ValueError("One or more slots are not available")

            # Update the slots' availability
            updated_slots = []
            for slot in slots:
                slot.is_available = False
                slot.save()  # Save each slot after updating
                updated_slots.append(slot)

            print("Updated slots:", updated_slots)  # Debugging line to check updated slots

            # Create the new appointment
            new_appointment = Appointment(
                dentist_id=dentist_id,
                patient_id=patient_id,
                service_id=service_id,
                appointment_datetime=appointment_datetime,
                appointment_duration=appointment_duration,
                status=status,
                branch=branch,
                reason=reason,
                booking_reference=get_unique_booking_reference(),
                slots_taken=slot_ids
            )
            new_appointment.save()

        return JsonResponse({"id": new_appointment.id}, status=201)

    except ValueError as e:
        return JsonResponse({"error": str(e)}, status=400)
    except Exception as e:
        # Log the error for server-side debugging
        print("Error:", str(e))  # More detailed logging
        return JsonResponse({"error": "Internal server error"}, status=500)


@csrf_exempt  # Use csrf_exempt for simplicity, but consider CSRF protection for production
def book_appointment(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            slot_ids = data.get('slot_ids')
            service_id = data.get('service_id')

            # Update the slots
            AppointmentSlot.objects.filter(id__in=slot_ids).update(is_available=False, service_id=service_id)

            return JsonResponse({"success": "Appointment booked successfully."})

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request"}, status=400)

@api_view(['DELETE'])
def delete_admin(request, admin_id):
    try:
        admin = Admin.objects.get(id=admin_id)
        admin.delete()
        return JsonResponse({'message': 'Admin deleted successfully!'})
    except Admin.DoesNotExist:
        return HttpResponseNotFound('Admin not found!')

@api_view(['DELETE'])
def delete_service(request, service_id):
    try:
        service = Service.objects.get(pk=service_id)
        service.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Service.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def deactivate_service(request, service_id):
    try:
        service = Service.objects.get(pk=service_id)
        service.status = 0
        service.save()
        return Response({"message": "Service deactivated successfully"}, status=status.HTTP_200_OK)
    except Service.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def add_service(request):
    try:
        service = Service(**request.data)
        service.save()
        return Response({"message": "Service added successfully"}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

def send_appointment_email(request, patient_id):
    patient = get_object_or_404(Patient, pk=patient_id)
    recipient = patient.email
    subject = "Your Appointment Confirmation"
    message = f"Dear {patient.full_name},\nYour appointment has been confirmed!"
    from_email = settings.EMAIL_HOST_USER
    send_mail(subject, message, from_email, [recipient])
    return HttpResponse("Email sent successfully.")

@api_view(['POST'])
def save_template(request):
    serializer = EmailTemplateSerializer(data=request.data)
    if serializer.is_valid():
        email_template = EmailTemplate(**serializer.validated_data)
        email_template.save()
        return Response({"message": "Template saved successfully"}, status=status.HTTP_201_CREATED)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@cache_page(60 * 15)  # Cache for 15 minutes
def get_dentists(request):
    dentists = Admin.objects.filter(is_superuser=0).values('id', 'username')
    return JsonResponse({'dentists': list(dentists)})

def get_consecutive_slots(slots, required_duration):
    """ 
    Find and return sets of consecutive slots that match the required duration. 
    """
    available_slots = []
    for i in range(len(slots)):
        if i + required_duration > len(slots):
            break

        consecutive = True
        for j in range(1, required_duration):
            if slots[i + j].start_time != slots[i + j - 1].end_time:
                consecutive = False
                break

        if consecutive:
            available_slots.append(slots[i:i + required_duration])

    return available_slots

@api_view(['GET'])
def get_reschedule_slots(request):
    date = request.GET.get('date')
    service_id = request.GET.get('service_id')
    dentist_id = request.GET.get('dentist_id')

    if not date or not service_id:
        return JsonResponse({"error": "Missing date or service_id"}, status=400)
    if dentist_id and not dentist_id.isdigit():
        return JsonResponse({"error": "Invalid dentist_id"}, status=400)

    try:
        date = datetime.strptime(date, '%Y-%m-%d').date()
        service = Service.objects.get(id=service_id)
        service_duration = datetime.combine(datetime.min, service.duration) - datetime.min

        required_slots = (service_duration.seconds // 60) // 15

        if dentist_id:
            slots_query = AppointmentSlot.objects.filter(
                start_time__date=date, 
                dentist_id=dentist_id, 
                is_available=True
            )
        else:
            slots_query = AppointmentSlot.objects.filter(
                start_time__date=date, 
                is_available=True
            )

        slots = list(slots_query.order_by('start_time'))
        matching_slots = get_consecutive_slots(slots, required_slots)

        available_slots = [{
            "id": [slot.id for slot in group],
            "start_time": group[0].start_time.strftime("%H:%M"),
            "end_time": (group[-1].start_time + service_duration).strftime("%H:%M")
        } for group in matching_slots]

        return JsonResponse({"slots": available_slots})

    except (ValueError, Service.DoesNotExist):
        return JsonResponse({"error": "Invalid input or service not found"}, status=400)
    
@api_view(['GET'])
def get_appointment_by_reference(request, booking_reference):
    try:
        # Try to get the appointment with the given booking reference
        appointment = Appointment.objects.get(booking_reference=booking_reference)
        
        # If the appointment is found, return its details
        appointment_details = {
            'id': appointment.id,
            'dentist_id': appointment.dentist_id,
            'patient_id': appointment.patient_id,
            'service_id': appointment.service_id,
            'appointment_datetime': appointment.appointment_datetime.isoformat(),
            'appointment_duration': str(appointment.appointment_duration),
            'status': appointment.status,
            'branch': appointment.branch,
            'reason': appointment.reason,
            'booking_reference': appointment.booking_reference,
            'slots_taken': appointment.slots_taken,
        }
        return Response(appointment_details)
    
    except ObjectDoesNotExist:
        # If no appointment is found with the given booking reference, return an error
        return Response({'error': 'Appointment not found'}, status=404)
###################################################################################################################
@csrf_exempt
def dialogflow_webhook(request):
    if request.method == "POST":
        body_unicode = request.body.decode('utf-8')
        body = json.loads(body_unicode)
        intent_name = body['queryResult']['intent']['displayName']
        print("intent name: ", intent_name)
        handlers = {
            "welcome.intent": handle_welcome_intent,
            "appointment-type.intent": handle_appointment_type_intent,
            "branch-selection.intent": handle_branch_selection_intent,
            "Firstname.intent": handle_firstname_intent,
            "PhoneNumber.intent": handle_phonenumber_intent,
            "Email.intent": handle_email_intent,
            "Reason.intent": handle_reason_intent,
            "Date.intent": handle_date_intent,
            "Time.intent": handle_time_intent,
            "Dentist.intent": handle_dentist_intent,
            "cancel-appointment.intent": handle_cancel_appointment_intent,
            "RescheduleServiceSelection.intent": handle_reschedule_service_intent,
            "RescheduleDentistSelection.intent": handle_reschedule_dentist_intent,
            "RescheduleDateSelection.intent": handle_reschedule_date_intent,
            "RescheduleTimeSelection.intent": handle_reschedule_time_intent,
            "RescheduleAppointment":handle_reschedule_appointment_intent,
            "EnterBookingReferenceReschedule": handle_enter_booking_reference_reschedule_intent,
            
        }

        return handlers.get(intent_name, lambda body: JsonResponse({"fulfillmentText": "Intent not recognized."}))(body)

    else:
        return JsonResponse({"error": "This endpoint only supports POST requests."}, status=405)
    


#################################################################
#RESCHEDULING

def validate_and_get_appointment(booking_reference):
    try:
        # Try to get the appointment with the given booking reference
        appointment = Appointment.objects.get(booking_reference=booking_reference)
        
        # If the appointment is found, return its details
        appointment_details = {
            'id': appointment.id,
            'dentist_id': appointment.dentist_id,
            'patient_id': appointment.patient_id,
            'service_id': appointment.service_id,
            'appointment_datetime': appointment.appointment_datetime,
            'appointment_duration': appointment.appointment_duration,
            'status': appointment.status,
            'branch': appointment.branch,
            'reason': appointment.reason,
            'booking_reference': appointment.booking_reference,
            'slots_taken': appointment.slots_taken,
        }
        return appointment_details
    
    except ObjectDoesNotExist:
        # If no appointment is found with the given booking reference, return None
        return None
    
def handle_reschedule_appointment_intent(request):
    # Construct the response to ask for the booking reference
    response = {
        "fulfillmentText": "Sure, I can help with that. Please provide your booking reference."
    }
    return JsonResponse(response)

def handle_enter_booking_reference_reschedule_intent(request):
    # Extract the booking reference from the user's message
    booking_reference = request['queryResult']['parameters'].get('booking_reference')

    # Validate the booking reference and retrieve the appointment details
    appointment = validate_and_get_appointment(booking_reference)
    if appointment is None:
        return JsonResponse({
            "fulfillmentText": "I couldn't find an appointment with that booking reference. Please check and try again."
        })

    # If the booking reference is valid, prompt the user to select a new service
    available_services = fetch_available_services()
    response = {
        "fulfillmentMessages": [
            {
                "platform": "DIALOGFLOW_MESSENGER",
                "quickReplies": {
                    "title": "Great! I've found your appointment. To reschedule, please choose a new service:",
                    "quickReplies": available_services
                }
            }
        ],
        "outputContexts": [
            {
                "name": f"{request['session']}/contexts/awaiting_reschedule_service",
                "lifespanCount": 5,
                "parameters": {
                    "original_appointment": appointment
                }
            }
        ]
    }
    return JsonResponse(response)

def handle_reschedule_service_intent(body):
    service_name = body['queryResult']['parameters'].get('service').lower()
    available_services = fetch_available_services()

    if service_name not in available_services:
        services_str = ', '.join(available_services)
        return JsonResponse({
            "fulfillmentText": f"We couldn't find that service. Please choose among the following: {services_str}.",
            "outputContexts": [
                {
                    "name": f"{body['session']}/contexts/awaiting_reschedule_service",
                    "lifespanCount": 5
                }
            ]
        })

    dentist_ids_for_service = get_dentists_for_service(service_name)
    if not dentist_ids_for_service:
        return JsonResponse({
            "fulfillmentText": f"Sorry, we currently don't have any dentists available for the service: {service_name}. Please choose another service or try later.",
            "outputContexts": [
                {
                    "name": f"{body['session']}/contexts/awaiting_reschedule_service",
                    "lifespanCount": 5
                }
            ]
        })

    dentists = Admin.objects.filter(id__in=dentist_ids_for_service).values('username')
    dentist_list = [dentist['username'] for dentist in dentists]

    return JsonResponse({
        "fulfillmentMessages": [
            {
                "platform": "DIALOGFLOW_MESSENGER",
                "quickReplies": {
                    "title": f"You've chosen the service '{service_name}'. Which dentist would you like to see for rescheduling?",
                    "quickReplies": dentist_list
                }
            }
        ],
        "outputContexts": [
            {
                "name": f"{body['session']}/contexts/awaiting_reschedule_dentist",
                "lifespanCount": 5,
                "parameters": {
                    "service_name": service_name
                }
            }
        ]
    })

def handle_reschedule_dentist_intent(body):
    dentist_name = body['queryResult']['parameters'].get('dentists')
    if not dentist_name or not isinstance(dentist_name, str):
        return JsonResponse({"fulfillmentText": "Please provide the name of the dentist."})

    dentist_name = dentist_name.lower()
    service_name = None
    for context in body.get('queryResult', {}).get('outputContexts', []):
        if 'awaiting_reschedule_dentist' in context.get('name', ''):
            service_name = context.get('parameters', {}).get('service_name')

    if not service_name:
        return reset_to_welcome(body, custom_message="Sorry, we couldn't find the service you're looking for.")

    try:
        dentist_id = Admin.objects.get(username__iexact=dentist_name).id
    except Admin.DoesNotExist:
        return reset_to_welcome(body, custom_message=f"Sorry, we couldn't find Dr. {dentist_name.capitalize()}. Please try again.")

    if dentist_id not in get_dentists_for_service(service_name):
        return reset_to_welcome(body, custom_message=f"Dr. {dentist_name.capitalize()} does not offer the service '{service_name}'. Please try selecting another service or dentist.")
    
    available_dates = get_available_dates_for_dentist(dentist_id)
    if not available_dates:
        return JsonResponse({"fulfillmentText": f"Sorry, Dr. {dentist_name.capitalize()} currently has no available slots."})

    return JsonResponse({
        "fulfillmentMessages": [
            {
                "platform": "DIALOGFLOW_MESSENGER",
                "quickReplies": {
                    "title": f"You've selected Dr. {dentist_name.capitalize()} for rescheduling. Please choose a new date:",
                    "quickReplies": available_dates
                }
            }
        ],
        "outputContexts": [
            {
                "name": f"{body['session']}/contexts/awaiting_reschedule_date",
                "lifespanCount": 5,
                "parameters": {
                    "dentist_id": dentist_id
                }
            }
        ]
    })

def get_dentist_name(dentist_id):
    try:
        dentist = Admin.objects.get(id=dentist_id, is_superuser=0)
        return f"{dentist.username}"
    except Admin.DoesNotExist:
        return None


def handle_reschedule_date_intent(body):
    try:
        # Extract the date from the user input
        date_str = body['queryResult']['parameters'].get('date')
        selected_date_obj = datetime.strptime(date_str, '%d/%m/%Y')

        # Initialize variables
        dentist_id, service_name = None, None

        # Retrieve the dentist ID and service name from the context
        for context in body.get('queryResult', {}).get('outputContexts', []):
            context_name = context.get('name', '')
            if 'awaiting_reschedule_date' in context_name:
                dentist_id = context.get('parameters', {}).get('dentist_id')
            if 'awaiting_reschedule_dentist' in context_name:
                service_name = context.get('parameters', {}).get('service_name')

        print("dentist id:", dentist_id)
        print("service name: ", service_name)
        if not dentist_id or not service_name:
            return JsonResponse({"fulfillmentText": "Sorry, we couldn't find the required details. Please start the rescheduling process again."})

        # Fetch available slots
        available_slots = fetch_available_slots_for_dentist_on_date(dentist_id, selected_date_obj, service_name)
        
        if not available_slots:
            return JsonResponse({"fulfillmentText": f"Sorry, no available slots for your selected dentist on {date_str}. Please choose another date."})
        
        # Construct quick replies for available slots
        quick_replies = [{"title": slot, "payload": slot} for slot in available_slots]
        dentist_name = get_dentist_name(dentist_id)
        return JsonResponse({
            "fulfillmentMessages": [
                {
                    "platform": "DIALOGFLOW_MESSENGER",
                    "quickReplies": {
                        "title": f"Here are the available slots for {service_name} by {dentist_name} on {date_str}. Please choose one:",
                        "quickReplies": [reply["title"] for reply in quick_replies]
                    }
                }
            ]
        })

    except Exception as e:
        print("Error encountered in handle_reschedule_date_intent:", e)
        return JsonResponse({"fulfillmentText": "An error occurred."})

@transaction.atomic
def handle_reschedule_time_intent(body):
    try:
        # Extract necessary parameters from the Dialogflow request
        selected_time = None
        selected_date = None
        booking_reference = None

        for context in body['queryResult']['outputContexts']:
            parameters = context.get('parameters', {})
            selected_time = selected_time or parameters.get('time')
            selected_date = selected_date or parameters.get('date')
            booking_reference = booking_reference or parameters.get('booking_reference')

        if not booking_reference:
            return JsonResponse({"fulfillmentText": "Booking reference not provided. Please provide your booking reference."})

        if not selected_time or not selected_date:
            return JsonResponse({"fulfillmentText": "Please provide both the time and the date for rescheduling."})

        # Parse the selected time and date into datetime objects
        start_time_str = selected_time.split('-')[0].strip()
        start_datetime_str = f"{selected_date.strip()} {start_time_str}"
        start_datetime = datetime.strptime(start_datetime_str, '%d/%m/%Y %I:%M %p')

        # Retrieve the appointment and service by booking reference
        appointment = Appointment.objects.select_for_update().get(booking_reference=booking_reference)
        service = Service.objects.get(id=appointment.service_id)

        # Release old slots
        old_slots = AppointmentSlot.objects.filter(id__in=appointment.slots_taken)
        for slot in old_slots:
            slot.is_available = True
            slot.service_id = None
            slot.save()

        # Calculate new appointment duration and end time
        service_duration_minutes = (service.duration.hour * 60) + service.duration.minute
        end_datetime = start_datetime + timedelta(minutes=service_duration_minutes)

        # Find and book new slots
        new_slot_ids = []
        slots_to_update = AppointmentSlot.objects.filter(
            dentist_id=appointment.dentist_id,
            start_time__gte=start_datetime,
            end_time__lte=end_datetime
        ).order_by('start_time')

        for slot in slots_to_update:
            if slot.is_available:
                new_slot_ids.append(slot.id)
                slot.is_available = False
                slot.service_id = service.id
                slot.save()

        # Check if we have enough slots to cover the new appointment duration
        required_slots_count = service_duration_minutes // 15  # Assuming each slot is 15 minutes

        if len(new_slot_ids) < required_slots_count:
            # Not enough slots available, rollback changes
            for slot_id in new_slot_ids:
                slot = AppointmentSlot.objects.get(id=slot_id)
                slot.is_available = True
                slot.service_id = None
                slot.save()
            raise Exception("Unable to reschedule the appointment due to insufficient slots.")

        # Update the appointment with the new slots and times
        appointment.slots_taken = new_slot_ids
        appointment.appointment_datetime = start_datetime
        appointment.save()

        # Prepare the confirmation message
        confirmation_msg = f"Your appointment has been successfully rescheduled to {start_datetime.strftime('%d/%m/%Y at %I:%M %p')}."

    except Service.DoesNotExist:
        confirmation_msg = "The specified service does not exist."
    except Appointment.DoesNotExist:
        confirmation_msg = "No appointment found with the provided booking reference."
    except ValueError as ve:
        confirmation_msg = f"The time or date format is incorrect: {str(ve)}"
    except Exception as e:
        confirmation_msg = f"An error occurred while rescheduling: {str(e)}"

    return JsonResponse({"fulfillmentText": confirmation_msg})
#################################################################
    
def handle_welcome_intent(body):
    return JsonResponse({
        "fulfillmentMessages": [
            {
                "platform": "DIALOGFLOW_MESSENGER",
                "quickReplies": {
                    "title": "Please select the type of appointment:",
                    "quickReplies": ["New Appointment", "Reschedule Appointment", "Cancel Appointment"]
                }
            }
        ],
        "outputContexts": [
            {
                "name": f"{body['session']}/contexts/awaiting_appointment_type",
                "lifespanCount": 5
            }
        ]
    })


def handle_appointment_type_intent(body):
    appointment_type = body['queryResult']['parameters'].get('appointment_types')
    print(appointment_type)
    valid_appointments = ["new appointment", "reschedule appointment", "cancel appointment"]

    if not appointment_type or appointment_type.lower() not in valid_appointments:
        return JsonResponse({
            "fulfillmentMessages": [
                {
                    "platform": "DIALOGFLOW_MESSENGER",
                    "quickReplies": {
                        "title": "Please specify the appointment type:",
                        "quickReplies": ["New Appointment", "Reschedule Appointment", "Cancel Appointment"]
                    }
                }
            ],
            "outputContexts": [
                {
                    "name": f"{body['session']}/contexts/awaiting-service-choice",
                    "lifespanCount": 5  # Keeps the awaiting_appointment_type context active
                }
            ]
        })
    elif appointment_type.lower() == "new appointment":
        branch = body['queryResult']['parameters'].get('clinics')  # Getting the branch input from the user.
        valid_branches = ["Clinic A", "Clinic B", "Clinic C"]
        
        if branch not in valid_branches:
            return JsonResponse({
                "fulfillmentMessages": [
                    {
                        "platform": "DIALOGFLOW_MESSENGER",
                        "quickReplies": {
                            "title": "Which branch are you going to?",
                            "quickReplies": ["Clinic A", "Clinic B", "Clinic C"]
                        }
                    }
                ],
                "outputContexts": [
                    {
                        "name": f"{body['session']}/contexts/awaiting_branch_selection",
                        "lifespanCount": 5  # Keeps the awaiting_branch_selection context active
                    }
                ]
            })
    elif appointment_type.lower() == "cancel appointment":
        return JsonResponse({
            "fulfillmentText": "Please provide the appointment booking reference you wish to cancel.",
            "outputContexts": [
                {
                    "name": f"{body['session']}/contexts/awaiting_appointment_id",
                    "lifespanCount": 5
                }
            ]
        })
        # If the branch is valid, you can continue with the usual flow.
    elif appointment_type.lower() == "reschedule appointment":
        return JsonResponse({
            "fulfillmentText": "Please provide the appointment ID you wish to reschedule.",
            "outputContexts": [
                {
                    "name": f"{body['session']}/contexts/awaiting_reschedule_appointment_id",
                    "lifespanCount": 5
                }
            ]
        })
    # Handle other appointment types...
    else:
        return JsonResponse({
            "fulfillmentText": f"I'm not sure how to handle that appointment type: {appointment_type}.",
            "outputContexts": [
                {
                    "name": f"{body['session']}/contexts/awaiting_service_choice",
                    "lifespanCount": 0  # Ends the awaiting_appointment_type context
                }
            ]
        })
    

def handle_cancel_appointment_intent(body):
    booking_reference = body['queryResult']['parameters'].get('booking_reference')
    
    if not booking_reference:
        return JsonResponse({
            "fulfillmentText": "Please provide a valid booking reference to cancel.",
            "outputContexts": [
                {
                    "name": f"{body['session']}/contexts/awaiting_booking_reference",
                    "lifespanCount": 5
                }
            ]
        })

    try:
        appointment = Appointment.objects.get(booking_reference=booking_reference)

        # Identifying the AppointmentSlot instance(s) corresponding to the canceled Appointment
        for slot_id in appointment.slots_taken:
            try:
                slot = AppointmentSlot.objects.get(id=slot_id)
                slot.is_available = True
                slot.service_id = 0
                slot.save()
            except AppointmentSlot.DoesNotExist:
                pass  # Handle or log the error if necessary

        appointment.delete()

        return JsonResponse({
            "fulfillmentText": f"Your appointment with booking reference {booking_reference} has been successfully canceled.",
        })
    except Appointment.DoesNotExist:
        return JsonResponse({
            "fulfillmentText": f"No appointment found with booking reference {booking_reference}. Please check and try again.",
        })


    

def handle_branch_selection_intent(body):
    branch = body['queryResult']['parameters'].get('clinics')
    print("selected:", branch)

    if branch not in ["Clinic A", "Clinic B", "Clinic C"]:
        return reset_to_welcome(body)

    # If the branch is valid
    return JsonResponse({
        "fulfillmentText": "Thank you for selecting " + branch + ". Please provide your full name (Same as your Identidy Card/IC).",
        "outputContexts": [
            {
                "name": f"{body['session']}/contexts/awaiting_firstname",  # Activates the context for awaiting the first name
                "lifespanCount": 5
            }
        ]
    })



def handle_firstname_intent(body):
    firstname = body['queryResult']['parameters'].get('firstname')

    # Check if the provided firstname is valid (e.g., at least 2 characters long).
    if not firstname or len(firstname) < 2:
        return reset_to_welcome(body)

    # If the firstname is valid, proceed with the original flow.
    return JsonResponse({
        "fulfillmentText": "Thank you! Now, please provide your phone number.",
        "outputContexts": [
            {
                "name": f"{body['session']}/contexts/awaiting_phonenumber",  # Activates the context for awaiting phone number
                "lifespanCount": 5
            }
        ]
    })


def handle_phonenumber_intent(body):
    phonenumber = body['queryResult']['parameters'].get('phonenumber')

    if not phonenumber:
        return reset_to_welcome(body)

    # Assuming here that if there's a phone number, it's valid. You might want to add more validations.
    return JsonResponse({
        "fulfillmentText": "Got it! May I know your email?",
        "outputContexts": [
            {
                "name": f"{body['session']}/contexts/awaiting_email",  # Activates the context for awaiting the email
                "lifespanCount": 5
            }
        ]
    })


def fetch_available_services():
    # Get all active services
    services = Service.objects.filter(status=1).values('name')
    return [service['name'].lower() for service in services]



def handle_email_intent(body):
    email_val = body['queryResult']['parameters'].get('email')
    email_pattern = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    
    if not email_val or not email_pattern.match(email_val):
        return reset_to_welcome(body)
    
    services_list = fetch_available_services()
    
    return JsonResponse({
        "fulfillmentMessages": [
            {
                "platform": "DIALOGFLOW_MESSENGER",
                "quickReplies": {
                    "title": "Thanks! We offer the following services. Which one are you interested in?",
                    "quickReplies": services_list
                }
            }
        ],
        "outputContexts": [
            {
                "name": f"{body['session']}/contexts/awaiting_service",  # Activates the context for awaiting the service
                "lifespanCount": 5
            }
        ]
    })



def handle_reason_intent(body):
    reason = body['queryResult']['parameters'].get('service').lower()
    available_services = fetch_available_services()

    if reason not in available_services:
        services_str = ', '.join(available_services)
        return reset_to_welcome(body, custom_message=f"We couldn't find that service. Please choose among the following: {services_str}.")

    output_contexts = [
        {
            "name": f"{body['session']}/contexts/service_context",
            "lifespanCount": 5,
            "parameters": {
                "service_name": reason
            }
        }
    ]
    
    dentist_ids_for_service = get_dentists_for_service(reason)
    if not dentist_ids_for_service:
        return reset_to_welcome(body, custom_message=f"Sorry, we currently don't have any dentists available for the service: {reason}. Please choose another service or try later.")

    dentists = Admin.objects.filter(id__in=dentist_ids_for_service).values('username')
    dentist_list = [dentist['username'] for dentist in dentists]
    return JsonResponse({
        "fulfillmentMessages": [
            {
                "platform": "DIALOGFLOW_MESSENGER",
                "quickReplies": {
                    "title": f"You've chosen the service '{reason}'. Which dentist would you like to see?",
                    "quickReplies": dentist_list
                }
            }
        ],
        "outputContexts": output_contexts
    })



# Handle the dentist intent
def handle_dentist_intent(body):
    dentist_name = body['queryResult']['parameters'].get('dentists')
    print("dentist selected: ", dentist_name)

    if not dentist_name or not isinstance(dentist_name, str):
        return JsonResponse({"fulfillmentText": "Please provide the name of the dentist."})

    dentist_name = dentist_name.lower()

    # Retrieve the service name from the context
    service_name = None
    for context in body.get('queryResult', {}).get('outputContexts', []):
        if 'service_context' in context.get('name', ''):
            service_name = context.get('parameters', {}).get('service_name')

    if not service_name:
        return reset_to_welcome(body, custom_message="Sorry, we couldn't find the service you're looking for.")

    # Retrieve the ID of the dentist based on their name
    try:
        dentist_id = Admin.objects.get(username__iexact=dentist_name).id
    except Admin.DoesNotExist:
        return reset_to_welcome(body, custom_message=f"Sorry, we couldn't find Dr. {dentist_name.capitalize()}. Please try again.")

    # Check if the chosen dentist offers the previously selected service
    if dentist_id not in get_dentists_for_service(service_name):
        return reset_to_welcome(body, custom_message=f"Dr. {dentist_name.capitalize()} does not offer the service '{service_name}'. Please try selecting another service or dentist.")
    
    # Fetch available dates for the chosen dentist
    available_dates = get_available_dates_for_dentist(dentist_id)
    if not available_dates:
        return JsonResponse({"fulfillmentText": f"Sorry, Dr. {dentist_name.capitalize()} currently has no available slots."})

    response = {
        "fulfillmentMessages": [
            {
                "platform": "DIALOGFLOW_MESSENGER",
                "quickReplies": {
                    "title": f"You've selected Dr. {dentist_name.capitalize()}. Please choose a date:",
                    "quickReplies": available_dates
                }
            }
        ],
        "outputContexts": [
            {
                "name": "{}/contexts/dentist_context".format(body['session']),
                "lifespanCount": 5,
                "parameters": {
                    "dentist_id": dentist_id
                }
            }
        ]
    }

    return JsonResponse(response)

# Function to check if a date is fully booked for a given dentist
def is_date_fully_booked(dentist_id, date):
    try:
        date_obj = datetime.strptime(date, '%d/%m/%Y')
        slots_on_date = AppointmentSlot.objects.filter(dentist_id=dentist_id, start_time__date=date_obj)
        return all(not slot.is_available for slot in slots_on_date)
    except Exception as e:
        print("Error in is_date_fully_booked:", str(e))
        return True

# Function to fetch available dates for a specific dentist
def get_available_dates_for_dentist(dentist_id):
    try:
        # Fetch only slots where is_available=1
        slots = AppointmentSlot.objects.filter(dentist_id=dentist_id, is_available=1).values('start_time').distinct()
        available_dates = [slot['start_time'].strftime('%d/%m/%Y') for slot in slots]
        
        # Convert to set and back to list to remove duplicates
        all_dates = sorted(list(set(available_dates)), key=lambda date: datetime.strptime(date, '%d/%m/%Y'))
        
        # Check if all slots on a date are taken, if so, skip that date
        top_5_dates = []
        for date in all_dates:
            day_slots = AppointmentSlot.objects.filter(dentist_id=dentist_id, start_time__date=datetime.strptime(date, '%d/%m/%Y'))
            if any(slot.is_available for slot in day_slots):
                top_5_dates.append(date)
                if len(top_5_dates) == 5:  # Return after getting the first 5 available dates
                    break
        
        return top_5_dates

    except Exception as e:
        print("Error in get_available_dates_for_dentist:", str(e))
        return []




# Function to fetch available dentists for a specific service
def get_dentists_for_service(service_name):
    try:
        service_offering = Service.objects.filter(name__icontains=service_name).first()
        if not service_offering:
            return []
        if not isinstance(service_offering.dentists, list):
            dentist_ids = [service_offering.dentists]
        else:
            dentist_ids = service_offering.dentists
        return dentist_ids
    except Exception as e:
        print("Error in get_dentists_for_service:", str(e))
        return []

def handle_date_intent(body):
    try:
        print("Start of handle_date_intent")

        # Extract the date from the user input
        date_str = body['queryResult']['parameters'].get('date')
        print("Received date_str:", date_str)

        # Convert the date string into a datetime object
        try:
            selected_date_obj = datetime.strptime(date_str, '%d/%m/%Y')
            print("Parsed date:", selected_date_obj)
        except ValueError:
            print("Error: Invalid date format.")
            return JsonResponse({"fulfillmentText": "Invalid date format. Please provide the date in the format 'DD/MM/YYYY'."})

        # Retrieve the dentist ID and service name from the context
        dentist_id, service_name = None, None
        for context in body.get('queryResult', {}).get('outputContexts', []):
            if 'dentist_context' in context.get('name', ''):
                dentist_id = context.get('parameters', {}).get('dentist_id')
            if 'service_context' in context.get('name', ''):
                service_name = context.get('parameters', {}).get('service_name')

        print("Dentist ID:", dentist_id, "Service Name:", service_name)

        if not dentist_id or not service_name:
            print("Error: Missing dentist_id or service_name.")
            return reset_to_welcome(body, custom_message="Sorry, we couldn't find the required details. Please start the booking process again.")

        # Fetch available slots
        available_slots = fetch_available_slots_for_dentist_on_date(dentist_id, selected_date_obj, service_name)
        
        if not available_slots:
            return JsonResponse({"fulfillmentText": f"Sorry, no available slots for your selected dentist on {date_str}. Please choose another date."})
        
        # Construct quick replies for available slots
        quick_replies = [{"title": slot, "payload": slot} for slot in available_slots]
        
        return JsonResponse({
            "fulfillmentMessages": [
                {
                    "platform": "DIALOGFLOW_MESSENGER",
                    "quickReplies": {
                        "title": f"Here are the available slots for {service_name} by {dentist_id} on {date_str}. Please choose one:",
                        "quickReplies": [reply["title"] for reply in quick_replies]
                    }
                }
            ]
        })

    except Exception as e:
        print("Error encountered in handle_date_intent:", e)
        return JsonResponse({"fulfillmentText": "An error occurred."})



def fetch_available_slots_for_dentist_on_date(dentist_id, selected_date, service_name):
    try:
        # Find the duration of the selected service
        service = Service.objects.get(name__iexact=service_name)
        service_duration = service.duration
        
        # Convert duration to number of slots (assuming 15 mins per slot)
        num_slots_needed = (service_duration.hour * 60 + service_duration.minute) // 15
        
        # Get the current date and time in Malaysia timezone
        malaysia_tz = pytz.timezone('Asia/Kuala_Lumpur')
        current_datetime = datetime.now(malaysia_tz)
        current_date = current_datetime.date()
        current_time = current_datetime.time()
        
        # Fetch all available slots for the selected dentist on the given date
        all_slots = AppointmentSlot.objects.filter(
            dentist_id=dentist_id,
            start_time__date=selected_date,
            is_available=True
        ).order_by('start_time')
        
        available_slots_grouped = []
        for i in range(len(all_slots) - num_slots_needed + 1):
            # If the selected date is today, ensure the start time of the slot is in the future
            if selected_date == current_date:
                if all_slots[i].start_time.time() <= current_time:
                    continue  # skip this slot as it's in the past for today
                
            if all([slot.is_available for slot in all_slots[i:i+num_slots_needed]]):
                start_time = all_slots[i].start_time.strftime('%I:%M %p')
                end_time = (all_slots[i+num_slots_needed-1].start_time + timedelta(minutes=15)).strftime('%I:%M %p')
                available_slots_grouped.append(f"{start_time} - {end_time}")
                
        return available_slots_grouped

    except Exception as e:
        print(f"Error in fetch_available_slots_for_dentist_on_date: {str(e)}")
        return []




def time_to_timedelta(time_obj):
    """Converts a datetime.time object to a datetime.timedelta object."""
    return timedelta(hours=time_obj.hour, minutes=time_obj.minute, seconds=time_obj.second)

def handle_time_intent(body):
    time_slot = body['queryResult']['parameters'].get('time')

    # Check if time_slot is provided and if it's a string
    if not time_slot or not isinstance(time_slot, str):
        return reset_to_welcome(body, custom_message="Please provide the time slot in the 'HH:MM AM/PM - HH:MM AM/PM' format. Please type out 'Hello' to restart.")

    # Ensure provided time slot matches the new format
    time_pattern = re.compile(r"^((0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)) - ((0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM))$")
    if not time_pattern.match(time_slot):
        return reset_to_welcome(body, custom_message="The provided time slot doesn't seem to be in the correct format. Please type out 'Hello' to restart.")

    # Retrieve the date, dentist ID and service name from the context
    date_str, dentist_id, service_name = None, None, None
    for context in body.get('queryResult', {}).get('outputContexts', []):
        if 'awaiting_date' in context.get('name', ''):
            date_str = context.get('parameters', {}).get('date')
        if 'awaiting_dentist' in context.get('name', ''):
            dentist_id = context.get('parameters', {}).get('dentists')
        if 'service_context' in context.get('name', ''):
            service_name = context.get('parameters', {}).get('service_name')

    # Build the confirmation message
    confirmation_msg = f"Thank you for selecting the time slot {time_slot}. Your appointment for {service_name} with {dentist_id} has been scheduled on {date_str}. Confirmation will be send to you via email very shortly Thank you"

    return JsonResponse({
        "fulfillmentText": confirmation_msg,
        "outputContexts": [
            {
                "name": f"{body['session']}/contexts/time_followup",
                "lifespanCount": 0  # Ends the time_followup context
            }
        ]
    })

def reset_to_welcome(body, custom_message=None):
    """ Resets the conversation to the welcome.intent """
    default_message = "What can I assist you with today? You can say \n 1) New appointment, \n 2) Reschedule Appointment or \n 3) Cancel Appointment "
    message = custom_message if custom_message else default_message

    return JsonResponse({
        "fulfillmentText": message,
        "outputContexts": [
            {
                "name": f"{body['session']}/contexts/welcome-followup",
                "lifespanCount": 5  # Resets to the welcome context
            }
        ]
    })

###########################################################################################
import random
import string

@csrf_exempt
def dialogflow_endpoint(request):
    post_data = json.loads(request.body.decode('utf-8'))
    user_message = post_data.get('message')
    session_id = post_data.get('session_id')

    response_data, dialogflow_response = send_to_dialogflow(user_message, session_id)

    # Process the dialogflow response to book the slot
    if dialogflow_response.query_result.intent.display_name == "Time.intent":
        book_appointment_slot(dialogflow_response)

    return JsonResponse(response_data)


def send_to_dialogflow(user_message, session_id):
    client = dialogflow.SessionsClient()
    project_id = 'sparkles-bot-rxbl'
    session = client.session_path(project_id, session_id)

    text_input = dialogflow.TextInput(text=user_message, language_code='en-US')
    query_input = dialogflow.QueryInput(text=text_input)

    response = client.detect_intent(session=session, query_input=query_input)
    fulfillment_text = response.query_result.fulfillment_text
    quick_replies = []

    for message in response.query_result.fulfillment_messages:
        if hasattr(message, 'quick_replies'):
            quick_replies.extend(message.quick_replies.quick_replies)

    return {
        "fulfillmentText": fulfillment_text,
        "quickReplies": quick_replies
    }, response  # Return both the processed response and the full API response


@transaction.atomic
def book_appointment_slot(dialogflow_response):
    # Extracting required information from dialogflow response
    service_name = None
    date_str = None
    time_str = None
    dentist_id = None
    branch = None
    reason = None

    for context in dialogflow_response.query_result.output_contexts:
        parameters = context.parameters
        service_name = service_name or parameters.get('service_name')
        date_str = date_str or parameters.get('date')
        time_str = time_str or parameters.get('time')
        dentist_id = dentist_id or parameters.get('dentist_id')
        branch = branch or parameters.get('clinics')  
        reason = reason or parameters.get('service')

    # Fetch service duration and ID from the database
    service = Service.objects.filter(name__iexact=service_name).first()
    if not service:
        print(f"No service found for name: {service_name}")
        return

    service_id = service.id
    duration = service.duration
    total_minutes = duration.hour * 60 + duration.minute

    # Extract start time and end time from the user-selected slot
    start_time_str, end_time_str = time_str.split('-')
    start_time = datetime.strptime(date_str + " " + start_time_str.strip(), "%d/%m/%Y %I:%M %p")
    end_time = start_time + timedelta(minutes=total_minutes)

    # Update appointment slots and collect slot IDs
    slots_to_update = AppointmentSlot.objects.filter(
        dentist_id=dentist_id,
        start_time__gte=start_time,
        end_time__lte=end_time
    )
    slot_ids = []
    for slot in slots_to_update:
        slot.is_available = False
        slot.service_id = service_id
        slot.save()
        slot_ids.append(slot.id)

    # Extract patient details from dialogflow response
    full_name = None
    phone = None
    email = None
    for context in dialogflow_response.query_result.output_contexts:
        parameters = context.parameters
        full_name = full_name or parameters.get('firstname')
        phone = phone or parameters.get('phonenumber')
        email = email or parameters.get('email')

    # Save the patient's information to the Patient model
    patient, created = Patient.objects.get_or_create(
        phone=phone, 
        defaults={
            'full_name': full_name,
            'email': email,
            'created_at': timezone.now(),
            'updated_at': timezone.now()
        }
    )

    # Add an entry to the Appointment table
    new_appointment = Appointment(
        dentist_id=dentist_id,
        patient_id=patient.id,  
        service_id=service.id,
        appointment_datetime=start_time,
        appointment_duration=duration,
        status='P',  
        branch=branch,
        reason=reason,
        booking_reference=get_unique_booking_reference(),
        slots_taken=slot_ids
    )
    new_appointment.save()

    # Send the confirmation email to the patient
    send_confirmation_email(patient, new_appointment, start_time, end_time)

def send_confirmation_email(patient, appointment, start_time, end_time):
    subject = 'Thank you for booking appointment with us'
    from_email = 'sparkstech123@gmail.com'  
    recipient_list = [patient.email]

    message = render_to_string('backend/email_success.html', {
        'patient': patient.full_name,
        'appointment_id': appointment.booking_reference,
        'appointment_date': appointment.appointment_datetime,
        'start_time': start_time,
        'end_time': end_time,
        'appointment_duration': appointment.appointment_duration,
        'branch': appointment.branch,
        'cancelation_link': 'http://yourwebsite.com/cancel/' + str(appointment.id)  
    })
    plain_message = strip_tags(message)
    
    send_mail(
        subject,
        plain_message,
        from_email,
        recipient_list,
        html_message=message,
    )

def get_unique_booking_reference(length=8):
    """Return a unique booking reference."""
    reference = generate_unique_reference(length)
    
    while Appointment.objects.filter(booking_reference=reference).exists():
        reference = generate_unique_reference(length)
    
    return reference


def generate_unique_reference(length=8):
    """Generate a random hexadecimal string of the given length."""
    reference = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    return reference



