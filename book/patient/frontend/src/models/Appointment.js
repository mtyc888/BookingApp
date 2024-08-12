export class Branch {
  constructor(id, name) {
      this.id = id;
      this.name = name;
  }

  static fromJson(json) {
    const id = validateInteger(json.id);
    const name = validateString(json.branch_name);

    return new Branch(id, name);
  }

  static list(data) {
    const _list = [];
    if (Array.isArray(data) && data.length > 0) {
      for (const item of data) {
        if (item && typeof item === 'object') {
          _list.push(Branch.fromJson(item));
        }
      }
    }
    return _list;
  }
}

export class Appointment { 
  constructor({
    id=0, 
    dentist_id=0, 
    patient_id=0, 
    service_id=0, 
    appointment_datetime='', 
    appointment_duration='', 
    status='', 
    booking_reference='', 
    branch='', 
    reason=''

  }) {
    this.id = id;
    this.dentist_id = dentist_id;
    this.patient_id = patient_id;
    this.service_id = service_id;
    this.dentist_id = dentist_id;
    this.appointment_datetime = appointment_datetime;
    this.appointment_duration = appointment_duration;
    this.status = status;
    this.booking_reference = booking_reference;
    this.branch = branch;
    this.reason = reason;
  }

  
}
class DisplayAppointment {
    constructor(date, appointments) {
      this.date = date;
      this.appointments = appointments;
    }

    static list(data) {
      const _list = [];
      if (Array.isArray(data) && data.length > 0) {
        for (const item of data) {
          if (item && typeof item === 'object') {
            _list.push(new DisplayAppointment(item));
          }
        }
      }
      return _list;
    }
  }
  
export class Dentist {
    constructor(id, first_name, last_name, email, appointments) {
        this.id = id;
        this.first_name = first_name;
        this.last_name = last_name;
        this.email = email;
        this.appointments = appointments;
    }

    static fromJson(json) {
      const id = validateInteger(json.id);
      const first_name = validateString(json.first_name);
      const last_name = validateString(json.last_name);
      const email = validateString(json.email);
      const appointments = validateArray(json.appointments) ? DisplayAppointment.list(json.appointments) : [];

      return new Dentist(id, first_name, last_name, email, appointments);
    }

    static fromDetailJson(json) {
      const id = validateInteger(json.id);
      const first_name = validateString(json.first_name);
      const last_name = validateString(json.last_name);
      const email = validateString(json.email);

      return new Dentist(id, first_name, last_name, email);
    }
}

function validateInteger(data){
  return typeof data === 'number' ? parseInt(data) : '';
}

function validateString(data){
  return typeof data === 'string' ? data.toString() : '';
}

function validateArray(data){
  return Array.isArray(data) ? true : false;
}