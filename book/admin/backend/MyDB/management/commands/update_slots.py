#!/usr/bin/env python3
# update_slots.py

import os
import sys
import django
import logging
from datetime import datetime
import pytz
from MyDB.models import AppointmentSlot  # replace 'your_app' with the name of your Django app

# Initialize logging
logging.basicConfig(filename='update_slots.log', level=logging.INFO, 
                    format='%(asctime)s [%(levelname)s] - %(message)s')
logger = logging.getLogger(__name__)

# Set up the Django environment
sys.path.append('D:/Book-It/book-it/admin/backend/MyDB/MyDB')  # replace with the path to your Django project
os.environ['DJANGO_SETTINGS_MODULE'] = 'MyDB.settings'  # replace 'your_project.settings' with your project's settings

django.setup()

def update_past_slots_availability():
    
    malaysia_tz = pytz.timezone('Asia/Kuala_Lumpur')
    current_datetime = datetime.now(malaysia_tz)

    past_slots = AppointmentSlot.objects.filter(
        start_time__lt=current_datetime,
        is_available=False
    )

    count = past_slots.update(is_available=True)
    
    logger.info(f"Updated {count} past appointment slots to available status.")

# Call the function
if __name__ == "__main__":
    try:
        logger.info("Running update_past_slots_availability function.")
        update_past_slots_availability()
        logger.info("Successfully updated appointment slots.")
    except Exception as e:
        logger.error(f"An error occurred while updating slots: {str(e)}")

