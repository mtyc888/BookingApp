from django.db import models
from tinymce.models import HTMLField
class Admin(models.Model):
    id = models.AutoField(primary_key=True)
    password = models.CharField(max_length=255)
    last_login = models.DateTimeField(max_length=6)
    is_superuser = models.IntegerField(max_length=1)
    username = models.CharField(max_length=150)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.CharField(max_length=254)
    is_staff = models.IntegerField(max_length=1)
    is_active = models.IntegerField(max_length=1)
    date_joined = models.DateTimeField()
    created_at = models.TimeField()
    updated_at = models.TimeField()

    class Meta:
        db_table = 'authentication_appuser'  # Specify the table name
        app_label = 'bookitdb'  # Specify the schema name

class Appointment(models.Model):
    id = models.AutoField(primary_key=True)
    dentist_id = models.IntegerField()
    patient_id = models.IntegerField()
    service_id = models.IntegerField()
    appointment_datetime = models.DateTimeField()
    appointment_duration = models.TimeField()
    status = models.CharField()
    created_at = models.DateTimeField(auto_now_add=True)
    update_at = models.DateTimeField(auto_now=True)
    branch = models.CharField()
    reason = models.CharField()
    booking_reference = models.CharField()
    slots_taken = models.JSONField(default=list)

    class Meta:
        db_table = 'appointments'  # Specify the table name
        app_label = 'bookitdb'  # Specify the schema name

class Patient(models.Model):
    id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=150)
    email = models.CharField(max_length=254)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'patients'  # Specify the table name
        app_label = 'bookitdb'  # Specify the schema name
        
class Service(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    duration = models.TimeField()
    status = models.IntegerField()
    created_at = models.DateTimeField()
    update_at = models.DateTimeField()
    dentists = models.JSONField()
    cost = models.DecimalField()

    class Meta:
        db_table = 'services'  # Specify the table name
        app_label = 'bookitdb'  # Specify the schema name

class Branch(models.Model):
    id = models.AutoField(primary_key=True)
    branch_name = models.CharField(max_length=45)

    class Meta:
        db_table = 'branches'
        app_label = 'bookitdb'

class AppointmentForm(models.Model):
    # Primary Key
    id = models.AutoField(primary_key=True)
    
    appointment_id = models.IntegerField(default=0, null=False)
    # Fields
    medical_conds = models.TextField(blank=True)
    medication = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    oral_hygiene = models.TextField(blank=True)
    gum_health = models.TextField(blank=True)
    dental_caries = models.TextField(blank=True)
    treatment_recommendations = models.TextField(blank=True)
    estimated_costs = models.DecimalField(max_digits=10, decimal_places=2) 

    created_at = models.DateTimeField(auto_now_add=True)
    update_at = models.DateTimeField(auto_now=True)

    REQUIRED_FIELDS=["appointment_id"]
    
    def __str__(self):
        return f"Appointment Form ID: {self.id}"
    class Meta: 
        db_table = 'appointment_forms'

class EmailTemplate(models.Model):
    email_templates_name = models.CharField(max_length=255)
    email_templates = models.JSONField()

    class Meta:
        db_table = 'emailTemplates'
        app_label = 'bookitdb'

class AppointmentSlot(models.Model):
    dentist_id = models.IntegerField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_available = models.BooleanField(default=True)  # 1 for available, 0 for taken
    service_id = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'appointment_slots'
