from django.core.management.base import BaseCommand
from backend.models import User, AppointmentSlot
from datetime import datetime, timedelta

class Command(BaseCommand):
    help = 'Generate and insert appointment slots for dentists'

    def handle(self, *args, **options):
        # Your code to generate and insert appointment slots goes here

        # Example code to generate slots for the next 7 days
        dentists = User.objects.values().filter(is_superuser=0)
        for dentist in dentists:
            print("dentist", dentist.get("id"))
            for day_offset in range(1):
                date = datetime.now() + timedelta(days=day_offset)
                # Generate slots for the day and insert them into the database
                # You can customize this logic based on your requirements

                # Example: Create a slot every 30 minutes from 9 AM to 5 PM
                start_time = datetime(date.year, date.month, date.day, 9, 0)
                end_time = start_time + timedelta(hours=1)
                current_time = start_time
                while current_time < end_time:
                    slot = AppointmentSlot(dentist_id=dentist.get("id"), start_time=current_time)
                    slot.save()
                    current_time += timedelta(minutes=30)

