# serializers.py
from rest_framework import serializers
from .models import Admin
from rest_framework import serializers
from .models import Appointment, AppointmentForm
class AdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Admin
        fields = '__all__'
                
class AppointmentSerializer(serializers.ModelSerializer):
    class Meta: 
        db_table = 'appointments'
        model = Appointment
        fields = '__all__'

    # by defauly, id is read-only, but in some case I want to overwrite it
    def __init__(self, *args, **kwargs):
        # Check if the 'allow_id_read_write' parameter is passed
        allow_id_read_write = kwargs.pop('allow_id_read_write', False)

        # Call the parent constructor
        super().__init__(*args, **kwargs)

        # Update the 'read_only' attribute of the 'id' field based on the parameter
        if allow_id_read_write:
            self.fields['id'].read_only = False
        else:
            self.fields['id'].read_only = True

class AppointmentFormSerializer(serializers.ModelSerializer):
    class Meta: 
        db_table = 'appointment_forms'
        model = AppointmentForm
        fields = ['id', 'appointment_id', 'medical_conds', 'medication', 'allergies', 'oral_hygiene', 'gum_health', 'dental_caries', 'treatment_recommendations', 'estimated_costs']


class EmailTemplateSerializer(serializers.Serializer):
    templateName = serializers.CharField(max_length=200)
    templateContent = serializers.JSONField()