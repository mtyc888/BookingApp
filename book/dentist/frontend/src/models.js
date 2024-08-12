export class Appointment{
    constructor(id, dentist_id, patient_id, service_id, appointment_datetime, appointment_duration, status) {
      this.id = this.validateField(id, 0);
      this.dentist_id = this.validateField(dentist_id, 0);
      this.patient_id = this.validateField(patient_id, 0);
      this.service_id = this.validateField(service_id, 0);
      this.appointment_datetime = this.validateField(appointment_datetime, ""); 
      this.appointment_duration = this.validateField(appointment_duration, ""); 
      this.status = this.validateField(status);
    }
  
    validateField(value, defaultValue) {
      if (value === null || value === undefined) {
        return defaultValue;
      }
      return value;
    }
  
    parseData(jsonData){
      const { id, dentist_id, patient_id, service_id, appointment_datetime, appointment_duration, status } = jsonData;
      
      const appointment = new Appointment(id, dentist_id, patient_id, service_id, appointment_datetime, appointment_duration, status);
      return appointment;
    }
  }


  export class Patient{
    constructor(id, first_name, last_name, phone, email) {
        this.id = this.validateField(id, 0);
        this.first_name = this.validateField(first_name, "");
        this.last_name = this.validateField(last_name, "");
        this.phone = this.validateField(phone, "");
        this.email = this.validateField(email, "");
    }

    validateField(value, defaultValue) {
        if (value === null || value === undefined) {
            return defaultValue;
        }
        return value;
    }
  
    parseData(jsonData){
      const { id, first_name, last_name, phone, email } = jsonData;
      const patient = new Patient(id, first_name, last_name, phone, email);
      return patient;
    }
  }
  
  export class Service{
    constructor(id, name, duration, status, created_at, update_at) {
        this.id = this.validateField(id, 0);
        this.name = this.validateField(name, "");
        this.duration = this.validateField(duration, "");
        this.status = this.validateField(status, "");
        this.created_at = this.validateField(created_at, "");
        this.update_at = this.validateField(update_at, "");
    }

    validateField(value, defaultValue) {
        if (value === null || value === undefined) {
            return defaultValue;
        }
        return value;
    }
  
    parseData(jsonData){
      const { id, name, duration, status, created_at, update_at } = jsonData;
      const service = new Service(id, name, duration, status, created_at, update_at);
      return service;
    }
  }
