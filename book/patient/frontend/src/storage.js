export default class AppointmentStorage {
      static branchKey = 'branch';
      static choiceKey = 'choice';
      static serviceKey = 'service';
      static dentistKey = 'dentist';
      static appointmentDateKey = 'appointment_date';
      static appointmentTimeKey = 'appointment_time';
      static bookingReferenceKey = 'booking_reference';
      static appointmentKey = 'appointment';
    constructor() {
        // this is accessible in local methods BUT NOT in static method
        //   this.branchKey = 'branch';
        //   this.choiceKey = 'choice';
        //   this.serviceKey = 'service';
        //   this.dentistKey = 'dentist';
        //   this.appointmentDateKey = 'appointment_date';
        //   this.appointmentTimeKey = 'appointment_time';
    }
  
    // Save a branch object to sessionStorage
    static setBranch(branch) {
      if (branch && typeof branch === 'object') {
        window.sessionStorage.setItem(AppointmentStorage.branchKey, JSON.stringify(branch));
      } else {
        console.error('Cannot save branch to window.sessionStorage.');
      }
    }

    static getBranch() {
      const storedBranch = window.sessionStorage.getItem(AppointmentStorage.branchKey);
      return storedBranch ? JSON.parse(storedBranch) : {};
    }

    static setChoice(choice) {
    if (choice && typeof choice === 'object') {
        window.sessionStorage.setItem(AppointmentStorage.choiceKey, JSON.stringify(choice));
    } else {
        console.error('Cannot save choice to window.sessionStorage.');
    }
    }

    static getChoice() {
        const storedChoice = window.sessionStorage.getItem(AppointmentStorage.choiceKey);
        return storedChoice ? JSON.parse(storedChoice) : {};
    }

    static setService(service) {
        if (service && typeof service === 'object') {
            window.sessionStorage.setItem(AppointmentStorage.serviceKey, JSON.stringify(service));
        } else {
            console.error('Cannot save service to window.sessionStorage.');
        }
    }

    static getService() {
        const storedService = window.sessionStorage.getItem(AppointmentStorage.serviceKey);
        return storedService ? JSON.parse(storedService) : {};
    }

    static setDentist(dentist) {
        if (dentist && typeof dentist === 'object') {
            window.sessionStorage.setItem(AppointmentStorage.dentistKey, JSON.stringify(dentist));
        } else {
            console.error('Cannot save dentist to window.sessionStorage.');
        }
    }

    static getDentist() {
        const stored = window.sessionStorage.getItem(AppointmentStorage.dentistKey);
        return stored ? JSON.parse(stored) : {};
    }
  
    static setAppointmentDate(appt_date) {
        if (appt_date && typeof appt_date === 'string') {
            window.sessionStorage.setItem(AppointmentStorage.appointmentDateKey, JSON.stringify(appt_date));
        } else {
            console.error('Cannot save appointment date to window.sessionStorage.');
        }
    }

    static getAppointmentDate() {
        const stored = window.sessionStorage.getItem(AppointmentStorage.appointmentDateKey);
        return stored ? JSON.parse(stored) : {};
    }

    static setAppointmentTime(appt_time) {
        if (appt_time && typeof appt_time === 'string') {
            window.sessionStorage.setItem(AppointmentStorage.appointmentTimeKey, JSON.stringify(appt_time));
        } else {
            console.error('Cannot save appointment time to window.sessionStorage.');
        }
    }

    static getAppointmentTime() {
        const stored = window.sessionStorage.getItem(AppointmentStorage.appointmentTimeKey);
        return stored ? JSON.parse(stored) : {};
    }
    
    static setAppointment(appt){
        if (appt && typeof appt === 'object') {
            window.sessionStorage.setItem(AppointmentStorage.appointmentKey, JSON.stringify(appt));
        } else {
            console.error('Cannot save appointment to window.sessionStorage.');
        }
    }

    static getAppointment() {
        const stored = window.sessionStorage.getItem(AppointmentStorage.appointmentKey);
        return stored ? JSON.parse(stored) : {};
    }

    static setBookingReference(ref){
        if (ref && typeof ref === 'string') {
            window.sessionStorage.setItem(AppointmentStorage.bookingReferenceKey, ref);
        } else {
            console.error('Cannot save booking reference to window.sessionStorage.');
        }
    }

    static getBookingReference() {
        const stored = window.sessionStorage.getItem(AppointmentStorage.bookingReferenceKey);
        return stored ? stored : {};
    }

    static clearAll() {
      window.sessionStorage.removeItem(AppointmentStorage.branchKey);
      window.sessionStorage.removeItem(AppointmentStorage.choiceKey);
      window.sessionStorage.removeItem(AppointmentStorage.serviceKey);
      window.sessionStorage.removeItem(AppointmentStorage.dentistKey);
      window.sessionStorage.removeItem(AppointmentStorage.appointmentDateKey);
      window.sessionStorage.removeItem(AppointmentStorage.appointmentTimeKey);

      //for rescheduling
      window.sessionStorage.removeItem(AppointmentStorage.bookingReferenceKey);
      window.sessionStorage.removeItem(AppointmentStorage.appointmentKey);
    }
  }
  
