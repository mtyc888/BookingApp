from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest, HttpResponseNotFound
from django.contrib.auth.decorators import login_required
from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status, pagination
from django.core.mail import send_mail
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from .models import User, Appointment, Patient, Service, Branch, EmailTemplate, AppointmentSlot
import json
import logging
import stripe
# Use caching if applicable
from django.views.decorators.cache import cache_page
from datetime import datetime, timedelta
from django.utils import timezone
import pytz
from dateutil import parser

# For sending email
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

stripe.api_key = settings.STRIPE_SECRET_KEY # This is your secret Stripe API key


#Problem to be solved: removed first appointment, then second appointment is 9/10 tht one does not removed


@login_required
def dashboard(request):
    return JsonResponse({'message': 'Welcome to the dashboard!'})


@api_view(['GET'])
def all_branches(request):
    try:
        branches = Branch.objects.values()
        print(branches)  # Add this to check what is being returned
        return JsonResponse({'branches': list(branches)})
    except:
        return JsonResponse({'branches': list([])})

@api_view(['GET'])
def all_services(request):
    try:
        services = Service.objects.values()
        return JsonResponse({'services': list(services)})
    except:
        return JsonResponse({'services': list([])})

@api_view(['POST'])
def stripe_checkout(request):
    try:
        checkout_session = stripe.checkout.Session.create(
            line_items=[
                {
                    'price': 'price_1NvArSLhRK9q9u5r5uuxIoF7',
                    'quantity': 1,
                },
            ],
            mode='subscription',
            payment_method_types=['card'],
            success_url= settings.SITE_URL + 'stripe?success=true&session_id={CHECKOUT_SESSION_ID}',
            cancel_url= settings.SITE_URL + 'stripe?canceled=true',
        )
        
        return redirect(checkout_session.url)

    except :
        return Response(
            {'error' : 'Something went wrong when creating stripe checkout session' },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def stripe_webhook(request):        
    payload = request.body
    event = None

    try:
        event = stripe.Event.construct_from(
            json.loads(payload), settings.STRIPE_SECRET_KEY
        )
    except ValueError as e:
        # Invalid payload
        return JsonResponse({'error': 'Invalid payload'}, status=400)

    # Handle specific event types related to Checkout Sessions
    if event.type == 'checkout.session.completed':
        # The checkout session was successfully completed
        # You can retrieve the session ID from `event.data.object.id`
        session_id = event.data.object.id
        # Handle the success case here
        # Retrieve customer information, send emails, etc.
        logger.info('PAYMENT SUCCESSFUL')
        

        # retrieve the customer info., all those things
        session = stripe.checkout.Session.retrieve(session_id)
        logger.info(session)

        # Payment was successful
        payment_info = {
            'session_id': session.id,
            'payment_status': session.payment_status,
            'payment_method': session.payment_method_types[0],  # Assuming there's only one payment method
            'amount': session.amount_total / 100, 
            'currency': session.currency,
            'customer_email': session.customer_details.email,
            # Add more payment-related properties as needed
        }

    elif event.type == 'checkout.session.async_payment_failed':
        session_id = event.data.object.id
        # Handle the failure case here
        # Notify the customer, update your records, etc.
        logger.info('PAYMENT FAILED')

    return JsonResponse({'status': 'Webhook received'}, status=200)








