from rest_framework import permissions, status
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest, HttpResponseNotFound
from django.core.serializers import serialize
from rest_framework.views import APIView
from rest_framework.response import Response

from rest_framework.decorators import api_view, permission_classes
from django.forms.models import model_to_dict
# Use caching if applicable
from django.views.decorators.cache import cache_page

import json
from .models import Dentist, Appointment, AppointmentForm, Patient, Service, Branch
from django.utils.crypto import get_random_string

# for serializers
from rest_framework import serializers
class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = '__all__'

class AppointmentFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentForm
        fields = '__all__'

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'

class ServiceSerializer(serializers.ModelSerializer):
    class Meta: 
        model = Service
        fields = '__all__'

@api_view(['POST'])
def register_user(request):
    # validate data b4 passed to serializer
    try:
        # check if username/email is exists already
        username = request.data["username"].strip()
        email = request.data["email"].strip()

        print("data", request.data, "data ", Dentist.objects.filter(email=email).exists())
        if not Dentist.objects.filter(email=email).exists():
            dentist = Dentist.objects.create(
                password = request.data["password"],
                username = request.data["username"].strip(),
                first_name = request.data["first_name"].strip(),
                last_name = request.data["last_name"].strip(),
                email = request.data["email"].strip(),
            )
            dentist.save()
            return JsonResponse({
                'dentist' : model_to_dict(dentist),
            }, status=201)
        else:
            return JsonResponse({'error': {
                "message":  "Failed to register",
                "details" : "Email exists already"
            }})

    except Exception as e:
        print("error", str(e))
        return JsonResponse({'error': {
                "message":  str(e),
                "details" : ""
            }})

@api_view(['POST'])
def login_user(request):
    # validate data b4 passed to serializer
    try:
        email = request.data["email"].strip()
        password = request.data["password"].strip()

        dentist = Dentist.objects.filter(email=email, password=password)
        
        if dentist:
            return JsonResponse({
                'dentist' : list(dentist.values()),
            }, status=200)
        else:
            return JsonResponse({'error': {
                "message":  "Failed to login",
                "details" : "nvalid email or password"
            }})
    except Exception as e:
        print("error", str(e))
        return JsonResponse({'error': {
                "message":  str(e),
                "details" : ""
            }})


@cache_page(60 * 15)
@api_view(['POST'])
def get_appointments(request):
    try:
        appointments = Appointment.objects.filter(dentist_id=request.data["dentist_id"])[:100]
        appointment_list = [{'id': appointment.id, 'patient_id': appointment.patient_id, 'dentist_id': appointment.dentist_id, 'appointment_datetime': appointment.appointment_datetime, 'branch': appointment.branch, 'reason': appointment.reason, 'appointment_duration': appointment.appointment_duration} for appointment in appointments]
        return JsonResponse({'appointments': appointment_list})
    except Exception as e:
        print("error", str(e))
        return JsonResponse({'error': {
                "message":  str(e),
                "details" : ""
            }})

@api_view(['POST'])
def get_appointment_form_by_id(request):
    try:
        id = request.data.get("id")

        appointment = Appointment.objects.get(pk=id)
        latest_appointment_form = AppointmentForm.objects.filter(appointment_id=id)
        if latest_appointment_form:
            latest_appointment_form = latest_appointment_form.latest('created_at')
        
        if(appointment):
            serializer = AppointmentSerializer(appointment)

            if(latest_appointment_form):
                serialize2 = AppointmentFormSerializer(latest_appointment_form)
                return HttpResponse(json.dumps({'appointment': serializer.data, 'form' : serialize2.data}))
            else:
                return HttpResponse(json.dumps({'appointment': serializer.data, 'form' : {}}))
        else: 
            return HttpResponse(json.dumps({'appointment': {}, 'form' : {}}))
    except Exception as e:
        print("error", str(e))
        return JsonResponse({'error': {
                "message":  str(e),
                "details" : ""
            }})


@api_view(['POST'])
def submit_appointment_form(request):
    try:
        if("appointment_id" not in request.data):
            raise Exception("Appointment ID missing")
        else:
            id = request.data["appointment_id"]

            serializer = AppointmentFormSerializer(data=request.data)            
            
            if serializer.is_valid():
                print(serializer.validated_data) #serializer.data

                # check if there is saved result in db
                latest_appointment_form = AppointmentForm.objects.filter(appointment_id=id)
                if latest_appointment_form.exists():
                    latest_appointment_form = latest_appointment_form.latest('created_at')
                    serializer = AppointmentFormSerializer(latest_appointment_form, data=request.data)
                    if serializer.is_valid():
                        serializer.save()
                else:
                    serializer.save()


                # set status to 1
                appointment = Appointment.objects.get(pk=id)
                appointment.status = 1
                appointment.save()

                return HttpResponse({
                                'message' : "Appointment result submited",
                                })
        return HttpResponse(json.dumps({'appointment': {}, 'form' : {}}))
    except Exception as e:
        print("error", str(e))
        return JsonResponse({'error': {
                "message":  str(e),
                "details" : ""
            }})

# haven't use
@api_view(['POST'])
def get_next_appointment(request):
    try:
        # stop checking for keys as this will be validated at frontend side
        
        # try get the appointment that is after current appointment date
        if all(key in request.data for key in ['appointment_datetime', 'dentist_id', 'patient_id', 'service_id']):
            
            appointments_queryset = Appointment.objects.filter(appointment_datetime__gt=request.data["appointment_datetime"], dentist_id=request.data["dentist_id"], patient_id=request.data["patient_id"], service_id=request.data["service_id"])

            # Use the serializer to validate and save data
            print(appointments_queryset)
            if appointments_queryset.exists(): 

                list_dict = appointments_queryset.values().first()
                # list_dict['id'] = appointments_queryset.first().id

                print("list_dict %s", list_dict)
                if list_dict:
                    returned_appointment = {
                        "id" : list_dict["id"], 
                        "dentist_id": list_dict["dentist_id"], 
                        "patient_id": list_dict["patient_id"], 
                        "service_id": list_dict["service_id"], 
                        'appointment_datetime': list_dict["appointment_datetime"].strftime('%Y-%m-%dT%H:%M:%SZ'),
                        'appointment_duration': list_dict["appointment_duration"].strftime('%H:%M:%S'),
                        "status": list_dict["status"], 
                        "branch": list_dict["branch"], 
                        "reason": list_dict["reason"], 
                        "booking_reference": list_dict["booking_reference"], 
                    }
                    return HttpResponse(json.dumps({'appointment': returned_appointment}), content_type='application/json')
                
            else:
                raise Exception("Appointment not exists")
            
        else: 
            raise KeyError("appointment_datetime missing") 
    except KeyError as k:
        print("error", str(e))
        return JsonResponse({'error': {
                "message":  str(e),
                "details" : ""
            }})
    except Exception as e:
        print("error", str(e))
        return JsonResponse({'error': {
                "message":  str(e),
                "details" : ""
            }})


@api_view(['POST'])
def set_next_appointment(request):
    try:    
        next_appointment_id = request.data["id"]
        current_appointment_id = request.data["current_appointment_id"]
        next_appointment = Appointment.objects.get(pk=next_appointment_id)

        print("next_appointment_id" , next_appointment_id, "current_appointment_id", current_appointment_id)
        if next_appointment_id != current_appointment_id:
            print("testing")

            #if appointment exists
            next_appointment.appointment_datetime = request.data.get('appointment_datetime')

            next_appointment.save()
                
            return HttpResponse(json.dumps({'appointment_id': next_appointment_id, 'message' : "Existing appointment updated"}))

        else:
            dentist = Dentist.objects.values().get(pk=request.data["dentist_id"])
            branch = Branch.objects.values("branch_name").get(pk=dentist["branch_id"])

            service = Service.objects.values().get(pk=request.data["service_id"])
            
            
            # just create new appointment
            appt = Appointment.objects.create(
                dentist_id=request.data["dentist_id"], 
                patient_id=request.data["patient_id"], 
                service_id=request.data["service_id"], 
                appointment_datetime=request.data["appointment_datetime"], 
                appointment_duration=request.data["appointment_duration"], 
                status='P', 
                branch=branch.get("branch_name"),
                reason=service.get("name"),
                booking_reference=get_random_string(length=8))
            # appt.save()

            serializer = AppointmentSerializer(appt)
            return HttpResponse(json.dumps({'appointment': serializer.data, 'message' : "New appointment created"}))

        
    except Exception as e:
        print("error", str(e))
        return JsonResponse({'error': {
                "message":  str(e),
                "details" : ""
            }})

@api_view(['POST'])
def delete_appointment(request):
    try:
        appt_id = request.data["appointment_id"]
        appt = Appointment.objects.get(id=appt_id)
        appt.delete()

        return JsonResponse({'message': 'Appointment deleted successfully!'})
    except Exception as e:
        print("error", str(e))
        return JsonResponse({'error': {
                "message":  str(e),
                "details" : ""
            }})

# haven't use
@cache_page(60 * 15)
@api_view(['POST'])
def get_patients(request):
    try:
        patients = Patient.objects.values()
        return JsonResponse({'patients': list(patients)})
    except Exception as e:
        print("error", str(e))
        return JsonResponse({'error': {
                "message":  str(e),
                "details" : ""
            }})


@api_view(['POST'])
def get_patient_by_id(request):
    try:
        id = request.data.get("id")

        patient = Patient.objects.get(pk=id)
        
        if (patient):
            serializer = PatientSerializer(patient)
            return HttpResponse(json.dumps({'patient' : serializer.data}))
            
    except Exception as e:
        print("error", str(e))
        return JsonResponse({'error': {
                "message":  str(e),
                "details" : ""
            }})

# haven't use
@cache_page(60 * 15)
@api_view(['POST'])
def get_services(request):
    try:
        services = Service.objects.values()
        return JsonResponse({'services': list(services)})
    except Exception as e:
        print("error", str(e))
        return JsonResponse({'error': {
                "message":  str(e),
                "details" : ""
            }})


@api_view(['POST'])
def get_service_by_id(request):
    try:
        id = request.data.get("id")

        print("id", id)
        service = Service.objects.get(pk=id)
        
        print("service", service)
        if (service):
            serializer = ServiceSerializer(service)
            return HttpResponse(json.dumps({'service' : serializer.data}))
            
    except Exception as e:
        print("error", str(e))
        return JsonResponse({'error': {
                "message":  str(e),
                "details" : ""
            }})