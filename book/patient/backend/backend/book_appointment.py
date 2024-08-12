from django.db import transaction
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest, HttpResponseNotFound

from .models import User, AppointmentSlot, Patient, Service, Branch, Appointment, EmailTemplate
from rest_framework.decorators import api_view
from datetime import datetime, timedelta
from django.utils import timezone
import pytz
import re 
import json

# For sending email
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

# For generating unique cancelation link
import jwt
import string
import secrets
import hashlib




@api_view(['GET'])
def get_all_slots(request):
    try:
        date = datetime.now()

        # Get the current datetime in a specific timezone (e.g., 'UTC')
        start_date = timezone.now()
        end_date = start_date + timedelta(days=5)

        slots = AppointmentSlot.objects.values().filter(start_time__date__range=[start_date.date(), end_date.date()])

        return JsonResponse({'slots': list(slots)})
    except Exception as e:
        print("Error", str(e))
        return JsonResponse({'slots': list([])})


@api_view(['GET'])
def insert_appointment_slots(request):
    try:
        start_time = "8:00 am"
        end_time = "5:00 pm"

        # Convert start and end times to datetime objects
        start = datetime.strptime(start_time, "%I:%M %p")
        end = datetime.strptime(end_time, "%I:%M %p")

        # Create the time slots with 15-minute intervals
        time_slot_intervals = []
        while start < end:
            end_slot = start + timedelta(minutes=15)
            time_slot_intervals.append((start.strftime("%I:%M %p"), end_slot.strftime("%I:%M %p")))
            start = end_slot

        
        insert_appointments = []
        
         # Create current_datetime and end_date
        
        current_date = timezone.now()
        end_date = current_date + timedelta(days=5)

        while current_date <= end_date:
            date=current_date

            for start_time, end_time in time_slot_intervals:
                start = datetime.strptime(start_time, "%I:%M %p")
                end = datetime.strptime(end_time, "%I:%M %p")


                # Get the current datetime in a specific timezone (e.g., 'UTC')
                tz = pytz.timezone('UTC')
                start_time = tz.localize(datetime(date.year, date.month, date.day, start.hour, start.minute, 0 , 0))
                end_time = tz.localize(datetime(date.year, date.month, date.day, end.hour, end.minute, 0 , 0))

                

                # Create and save the appointment slot
                appointment_slot = AppointmentSlot.objects.create(
                    dentist_id=10, start_time=start_time, end_time=end_time, is_available=True
                )
                appointment_slot.save()

                insert_appointments.append(appointment_slot.id)

            #loop to next date
            current_date += timedelta(days=1)

        return JsonResponse({'message': 'Appointment slots added successfully', 'appointments' : list(insert_appointments)})
    except Exception as e:
        print("Exception: ", str(e))
        return JsonResponse({'message': 'Failed to add appointment slots'})


@api_view(['GET','POST'])
def get_appointments(request):
    try:
        data = request.data

        branch_name = data["branch_name"]
        service = Service.objects.values().get(pk=data["service_id"])
        service_duration = service.get("duration")

        # Convert duration to number of slots (assuming 15 mins per slot)
        num_slots_needed = (service_duration.hour * 60 + service_duration.minute) // 15

        dentists = service.get("dentists")

        returned_data = []

        for dentist_id in dentists:
            dentist = User.objects.values('id', 'first_name', 'last_name', 'email').get(pk=dentist_id)

            start_date = timezone.now() 

            if data["appointment_date"] is not None:                
                start_date = datetime.strptime(data["appointment_date"], '%Y-%m-%dT%H:%M:%S.%f%z') 

            end_date = start_date + timedelta(days=5)
            # get all available appointment slots for that dentist
            available_appointment_slots = AppointmentSlot.objects.filter(
                dentist_id=dentist_id, 
                start_time__date__gte=start_date.date(),
                end_time__date__lte=end_date.date())

            current_date = start_date

            dentist_appointments = [] #list of appointments for the dentist
            while current_date < end_date:    
                # available slots
                all_slots = available_appointment_slots.filter(start_time__date=current_date)
                
                # calculate available slots based on service duration
                available_slots_grouped = []
                for i in range(len(all_slots) - num_slots_needed + 1):
                    # print(all_slots[i], " ", all_slots[i+num_slots_needed-1], all([slot.is_available for slot in all_slots[i:i+num_slots_needed]]))
                    if all([slot.is_available for slot in all_slots[i:i+num_slots_needed]]):
                        start_time = all_slots[i].start_time.strftime('%I:%M %p')
                        end_time = (all_slots[i+num_slots_needed-1].start_time + timedelta(minutes=15)).strftime('%I:%M %p')
                        available_slots_grouped.append(f"{start_time} - {end_time}")
                

                # only enter the appointmentlist if 
                appointment_data = {
                    'date' : current_date,
                    'appointments' : list(available_slots_grouped)
                }
                
                dentist_appointments.append(appointment_data)

                #loop to next date
                current_date += timedelta(days=1)

            dentist_data = {
                'id' : dentist['id'],
                'first_name': dentist['first_name'],
                'last_name': dentist['last_name'],
                'email': dentist['email'],
                'appointments' : list(dentist_appointments)
            }

            returned_data.append(dentist_data)
        
        return JsonResponse({'appointments': list(returned_data)})
    except Exception as e:
        print("Error:", str(e))
        return JsonResponse({'appointments': list()})


# add appointments by 
@api_view(['POST'])
# @transaction.atomic
def add_appointment(request):
    # THIS IS SYNCHRONIZER
    time_range = request.data["appointment_time"]
    
    # Use regular expressions to extract start and end times
    matches = re.findall(r'\d+:\d+ [APM]+', time_range)

    if len(matches) == 2:
        start_time, end_time = matches

        start_time = datetime.strptime(start_time, '%I:%M %p')
        end_time = datetime.strptime(end_time, '%I:%M %p')
        
        appointment_date = datetime.strptime(request.data["appointment_date"], "%Y-%m-%dT%H:%M:%S.%f")

        start_datetime = start_time.replace(year=appointment_date.year, month=appointment_date.month, day=appointment_date.day)
        end_datetime = end_time.replace(year=appointment_date.year, month=appointment_date.month, day=appointment_date.day)

        # get list of the appointments first
        queryset = AppointmentSlot.objects.values('id').filter(start_time__gte=start_datetime, end_time__lte=end_datetime)
        slot_ids_to_lock =  list(queryset.values_list('id', flat=True))
        print("slot_ids_to_lock", slot_ids_to_lock)

    try:
        # Begin a transaction using @transaction.atomic()
        with transaction.atomic():
            # Lock the appointment slot
            slots = AppointmentSlot.objects.select_for_update().filter(id__in=slot_ids_to_lock)

            print("all([slot.is_available for slot in slots])", all([slot.is_available for slot in slots]))
            if all(slot.is_available for slot in slots):
                for slot in slots:
                    slot.is_available = False
                    slot.save()

                # Continue the operation
                # After locking the appointment slots, proceed to booking
                try:
                    data = request.data

                    print({"data", tuple(request.data.items())})

                    # add new patient
                    patient_id = add_new_patient(request.data)

                    if(patient_id == 0):
                        raise Exception('Failed to add new patient')

                    else:
                        # add new appointment for this patient
                        appt_date = data["appointment_date"]
                        appointment_time = data["appointment_time"]
                        
                        date_time = datetime.strptime(appt_date, "%Y-%m-%dT%H:%M:%S.%f")

                        appointment_date = date_time.replace(hour=start_datetime.hour, minute=start_datetime.minute, second=0, microsecond=0).strftime("%Y-%m-%dT%H:%M:%S.%f")

                        service = Service.objects.values().get(pk=data["service_id"])
                        appointment_duration = "00:00:00"
                        
                        if(service) :
                            appointment_duration = service.get("duration")

                            # add new appointment
                            appt = Appointment.objects.create(
                                dentist_id=data["dentist_id"], 
                                patient_id=patient_id, 
                                service_id=data["service_id"], 
                                appointment_datetime=appointment_date, 
                                appointment_duration=appointment_duration, 
                                status='P', 
                                branch=data.get("branch_name"),
                                reason=data.get("service_name"))
                            appt.save()
                            
                            booking_reference = Appointment.objects.values().get(pk=appt.id)["booking_reference"]

                            #send email here
                            send_email(patient_id, appt.id, appointment_date, start_time, end_time, appointment_duration, booking_reference, "email_success.html")

                            return JsonResponse({'appointment_id': appt.id})
                
                except Exception as e:
                    print("Error", str(e))
                    raise Exception(str(e))
  
            else: 
                raise Exception('Appointment Slot is not available')

                # Add the user to the waiting list if the slot is already locked
                # WaitingList.objects.create(user=request.user, slot=slot)

    except AppointmentSlot.DoesNotExist as err:
        # Handle slot not found
        print("Exception: ", str(err))
        return JsonResponse({'error': {
                "message":  str(err),
                "details" : ""
            }})
    except Exception as e:
        # Rollback the transaction
        transaction.rollback()
        
        # Handle other exceptions
        print("Exception: ", str(e))
        return JsonResponse({'error': {
                "message":  "Failed to add appointment",
                "details" : str(e)
            }})
def send_email(patient_id, appointment_id, appt_datetime, start_time, end_time, appointment_duration, booking_reference, email_template_name):
    # 
    # patient_id = 24
    # appointment_id = 69 
    # appt_datetime = "2023-10-11T13:15:00.000000Z" 
    # start_time = "1900-01-01 10:15:00"
    # end_time = "1900-01-01 12:15:00"
    # appointment_duration = "00:45:00"
    try:
        print("appt_datetime", appt_datetime)
        print("start_time", start_time)
        print("end_time", end_time)
        print("appointment_duration", appointment_duration)
        # input_datetime = parser.isoparse(appt_datetime)

        # appointment_date = input_datetime.strftime("%b %d, %Y")
        # appointment_time = input_datetime.strftime("%I:%M %p")
        input_datetime = datetime.strptime(appt_datetime, "%Y-%m-%dT%H:%M:%S.%f")

        # Extract the date and time components
        appointment_date = input_datetime.strftime("%Y-%m-%d")
        start_time = start_time.strftime("%I:%M %p")
        end_time = end_time.strftime("%I:%M %p")
        appointment_duration = appointment_duration.strftime("%H:%M:%S")

        cancelation_link = generate_cancellation_link(appointment_id, booking_reference, appt_datetime)
        print('cancelation_link', cancelation_link)

        # get email templates from database first
        template = EmailTemplate.objects.values().get(pk=1)
        email_template = template["email_templates"]
        
        patient = Patient.objects.values().get(pk=patient_id) # Replace this with the actual user object
        subject = 'Thank you for booking appointment with us'
 
        html_message = render_to_string('backend/' + email_template_name, {'patient': patient, 'appointment_id': appointment_id, 'appointment_date': appointment_date, 'start_time': start_time, 'end_time': end_time, 'appointment_duration' : appointment_duration, 'booking_reference': booking_reference,'cancelation_link': cancelation_link})
        plain_message = strip_tags(html_message)
        
        send_mail(
            subject,
            plain_message,
            'sparkstech123@gmail.com',
            [patient["email"]],
            html_message=html_message,
        )

        # subject = 'Hello, World!'
        # message = 'This is a test email from Django.'
        # from_email = 'sparkstech123@gmail.com'
        # recipient_list = ['whuiying461@gmail.com']

        # Send the email
        # send_mail(subject, message, from_email, recipient_list)

        return JsonResponse({'message': 'Email sent successfully'})

    except Exception as e:
        print("Error:", str(e))
        return JsonResponse({'error': {
            "message": 'Failed to send email',
            "details": str(e)
        }})

def add_new_patient(data):
    patient_id = 0
    try:
        existing_patient = Patient.objects.filter(email=data.get("email")).first()

        
        patient = None
        if existing_patient:
            patient_id = existing_patient.id
        else: 
            # add new patient
            new_patient  = Patient.objects.create(full_name=data.get("full_name"), phone=data.get("phone"), email=data.get("email"))
            new_patient.save()
            patient_id = new_patient.id

        return patient_id
    except Exception as e:
        print("Error:", str(e))
        return patient_id



@api_view(['DELETE'])
def delete_admin(request, admin_id):
    try:
        admin = Admin.objects.get(id=admin_id)
        admin.delete()
        return JsonResponse({'message': 'Admin deleted successfully!'})
    except Admin.DoesNotExist:
        return HttpResponseNotFound('Admin not found!')

@api_view(['POST'])
def cancel_appointment(request):
    try:
        booking_reference = request.data.get('booking_reference')
        print('booking_reference', booking_reference)
        appointment = Appointment.objects.values().filter(booking_reference=booking_reference).first()
        appointment_to_delete  = Appointment.objects.filter(booking_reference=booking_reference)

        if appointment_to_delete :
            print("appointment", appointment["appointment_datetime"])

            # Free the appointment slots for others to book
            appointment_datetime = appointment["appointment_datetime"]
            appointment_duration = appointment["appointment_duration"]
            num_slots_used = (appointment_duration.hour * 60 + appointment_duration.minute) // 15

            print("num_slots_used", num_slots_used, "appointment_datetime", appointment_datetime, "appointment_duration", appointment_duration)

            slot_ids_to_free = []
            first_slot = AppointmentSlot.objects.filter(start_time__gte=appointment_datetime).first()
            first_slot_id = first_slot.id
        
            for i in range(num_slots_used):
                slot_ids_to_free.append(first_slot_id)
                first_slot_id += 1

            print("slot_ids_to_free", slot_ids_to_free)
            
            # Begin a transaction using @transaction.atomic()
            with transaction.atomic():
                # Lock the appointment slot
                slots = AppointmentSlot.objects.select_for_update().filter(id__in=slot_ids_to_free)

                print("slots", slots)
                print("all([not slot.is_available for slot in slots])", all([not slot.is_available for slot in slots]))
                if all(not slot.is_available for slot in slots):
                    for slot in slots:
                        slot.is_available = True
                        slot.save()

                    # Delete the appointments (update status to C)
                    # appointment_to_delete.update(status='C')
                    appointment_to_delete.delete()

                    #send email to user
                    duration_timedelta = timedelta(hours=appointment_duration.hour, minutes=appointment_duration.minute, seconds=appointment_duration.second)
                    end_time = appointment_datetime + duration_timedelta

                    send_email(appointment.get("patient_id"), appointment.get("id"), 
                            appointment_datetime.strftime('%Y-%m-%dT%H:%M:%S.%f'), appointment_datetime, end_time,
                            appointment.get("appointment_duration"), booking_reference, "cancel_success.html")
                    


            return JsonResponse({'success': True, 'message': 'Appointment deleted successfully!'})
    except Appointment.DoesNotExist:
        return JsonResponse({'success': False, 'error' : {
            'message': 'Appointment not found',
            'details' : ''
        }})

SECRET_KEY  = "Y2j!Qh'UiDzkKF]@$_Q,~+t06qbc!O,5yBO0oAVJ,G,EeMDrN4KU4tI3RUk<!Z"

@api_view(['POST'])
def validate_cancellation_token(request):
    try:
        cancellation_token = request.data['cancellation_token']
        print("cancellation_token", cancellation_token)
        payload = jwt.decode(cancellation_token, SECRET_KEY, algorithms=['HS256'])

        appointment_datetime = datetime.strptime(payload.get('appointment_datetime'), "%Y-%m-%dT%H:%M:%S.%f")
        future_7_datetime = datetime.now() + timedelta(days=7)
        
        # Appointment can only be cancelled 7 days before the actual appointment date
        message = ''
        if  appointment_datetime > future_7_datetime:
            pass
        else:
            message +=  'Penalty will be given as late cancellation is requested'

        return JsonResponse({
            'success': True, 
            'data' : {
                'appointment_id': payload.get('appointment_id'),
                'booking_reference': payload.get('booking_reference'),
                'appointment_datetime': payload.get('appointment_datetime')
            },
            'message': message
        })
    except jwt.ExpiredSignatureError:
        # Handle token expiration if needed
        return JsonResponse({'success': False, 'error' : {
            'message': 'Invalid cancellation link',
            'details' : ''
        }})
    except jwt.DecodeError:
        # Handle invalid or tampered tokens
        return JsonResponse({'success': False, 'error' : {
            'message': 'Invalid cancellation link',
            'details' : ''
        }})

def generate_cancellation_link(appointment_id, booking_reference, appointment_datetime):
    # Generate a random, secure token
    random_token = secrets.token_urlsafe(16)  # Adjust the token length as needed

    payload = {
        'appointment_id': appointment_id,
        'booking_reference': booking_reference,
        'appointment_datetime': appointment_datetime
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

    # Construct the cancellation link
    cancellation_link = f"http://localhost:3000/cancel_appointment/?token={token}"

    return cancellation_link



# Rescheduling Appointment
@api_view(['POST'])
def validate_booking_reference(request):
    try:
        branch_name = request.data['branch_name']
        booking_reference = request.data['booking_reference']
        print("branch_name", branch_name, "booking_reference", booking_reference)

        appointment = Appointment.objects.values().filter(branch=branch_name, booking_reference=booking_reference)
        

        print("appointment", appointment)
        if(appointment.count() == 1):   
            return JsonResponse({
                'success': True, 
                'data' : appointment.first(),
                'message': 'Valid booking reference'
            })
        else: 
            return JsonResponse({'success': False, 'error' : {
                'message': 'Invalid booking reference',
                'details' : ''
            }})
    except jwt.ExpiredSignatureError:
        # Handle token expiration if needed
        return JsonResponse({'success': False, 'error' : {
            'message': 'Invalid booking reference',
            'details' : ''
        }})
    except jwt.DecodeError:
        # Handle invalid or tampered tokens
        return JsonResponse({'success': False, 'error' : {
            'message': 'Invalid booking reference',
            'details' : ''
        }})


# Reschedule appointment
@api_view(['POST'])
def reschedule_appointment(request):
    try:
        booking_reference = request.data['booking_reference']
        print('booking_reference', booking_reference, 'appointment_date', request.data['appointment_date'], 'appointment_time', request.data['appointment_time'], 'dentist_id', request.data['dentist_id'])
        appointment = Appointment.objects.values().filter(booking_reference=booking_reference).first()
        appointments_to_update  = Appointment.objects.filter(booking_reference=booking_reference)

        if appointments_to_update:
            # Free the appointment slots for others to book
            appointment_datetime = appointment["appointment_datetime"]
            appointment_duration = appointment["appointment_duration"]
            num_slots_used = (appointment_duration.hour * 60 + appointment_duration.minute) // 15

            print("num_slots_used", num_slots_used, "appointment_datetime", appointment_datetime, "appointment_duration", appointment_duration)

            slot_ids_to_free = []
            first_slot_to_free = AppointmentSlot.objects.filter(start_time__gte=appointment_datetime).first()
            first_slot_to_free_id = first_slot_to_free.id
        
            for i in range(num_slots_used):
                slot_ids_to_free.append(first_slot_to_free_id)
                first_slot_to_free_id += 1

            # Find the slots to book
            new_appointment_datetime = request.data['appointment_date']
            matches = re.findall(r'\d+:\d+ [APM]+', request.data['appointment_time'])
            if len(matches) == 2:
                start_time, end_time = matches

                start_time = datetime.strptime(start_time, '%I:%M %p')
                end_time = datetime.strptime(end_time, '%I:%M %p')
            new_appointment_datetime = datetime.combine(appointment_datetime.date(), start_time.time())

            slot_ids_to_book = []
            first_slot_to_book = AppointmentSlot.objects.filter(start_time__gte=new_appointment_datetime).first()
            first_slot_to_book_id = first_slot_to_book.id
        
            for i in range(num_slots_used):
                slot_ids_to_book.append(first_slot_to_book_id)
                first_slot_to_book_id += 1
            
            # Begin a transaction using @transaction.atomic()
            with transaction.atomic():
                # Lock the appointment slot
                free_slots = AppointmentSlot.objects.select_for_update().filter(id__in=slot_ids_to_free)
                if all(not slot.is_available for slot in free_slots):
                    for slot in free_slots:
                        slot.is_available = True
                        slot.save()

                book_slots = AppointmentSlot.objects.select_for_update().filter(id__in=slot_ids_to_book)
                if all(slot.is_available for slot in book_slots):
                    for slot in book_slots:
                        slot.is_available = False
                        slot.save()

                # Update the appointments (update status to R)
                appointments_to_update.update(appointment_datetime=new_appointment_datetime, status='R')


                #send email here
                print("appointment", appointment.get("patient_id"))
                send_email(appointment.get("patient_id"), appointment.get("id"), 
                request.data['appointment_date'], start_time, end_time, 
                appointment_duration, booking_reference, "email_success.html")


            return JsonResponse({'success': True, 'message': 'Appointment updated successfully!'})
    except Appointment.DoesNotExist:
        return JsonResponse({'success': False, 'error' : {
            'message': 'Appointment not found',
            'details' : ''
        }})