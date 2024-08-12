# For automatically generating booking reference in database
import random
import string
from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Appointment

# Generating booking reference
def generate_booking_reference(length=8):
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choice(characters) for _ in range(length))


# use Django's signals to automatically generate the booking reference before saving a new appointment or updating an existing one.
# Create a signal function and connect it to the pre_save signal of the Appointment model.
@receiver(pre_save, sender=Appointment)
def generate_unique_booking_reference(sender, instance, **kwargs):
    if not instance.booking_reference:
        instance.booking_reference = generate_booking_reference()


# For signal configuration, add the below lines in apps.py, then add this file in INSTALLED_APPS, settings.py
# def ready(self):
        # import backend.signals  # Replace 'your_app' with the name of your app

