# For celery
import os
from celery import Celery
from datetime import datetime, timedelta

# Celery - For synchronizer
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

CELERY_BROKER_URL = 'memory://'
CELERY_RESULT_BACKEND = 'rpc://'  # Use the same message broker for results

# Enable scheduled tasks
CELERY_BEAT_SCHEDULE = {
    'generate-appointment-slots': {
        'task': 'backend.tasks.generate_appointment_slots',  # Path to your Celery task
        'schedule': timedelta(days=7),  # Run the task weekly
    },
}
