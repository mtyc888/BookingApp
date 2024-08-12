import  {useState, useEffect} from 'react';
import axios from 'axios';
import {Appointment, Service} from "../models";
import styles from "../styles";
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { UserManager, LSAppointment } from '../storage.js';
import moment from 'moment';
import { BASE_URL } from '../App.js';
import {Loading} from "../components/Loading.jsx";
//3 situations:
//1. click new appointment directly (done odi, but may have some flaws, checking required)
//2. from existing appointment -> no followup appointment at all (make sure current existing , can change all)
//3. from existing appointment -> have followup appointment odi (can only change appointment_datetime and appointment_duration, disable changing services and patients)

//not yet test if there is existing appointment (same dentistid, patientid and service id)
//not yet test if there is appointment crashing
// not yet implement automated google email notification

function NextAppointment() {

  const navigate = useNavigate(); 

  const userManager = new UserManager();
  const appointment = LSAppointment.getAppointment();
  const dentist = userManager.getUser();

  const [loading, isLoading] = useState(false);
  // const {state} = useLocation();
  const [service, setService] = useState(new Service());
  const [disabledService, isDisabledService] = useState(false);
  const [reminder, setReminder] = useState("click new appointment directly"); //just for debugging
  const [formData, setFormData] = useState({
      id: appointment.id ?? 0,
      dentist_id: appointment.dentist_id ?? 0,
      patient_id: appointment.patient_id ?? 0,
      service_id: appointment.service_id ?? 0,
      appointment_datetime : appointment.appointment_datetime ?? "0000-00-00 00:00:00.123Z",
      appointment_duration: appointment.appointment_duration ?? "00:00:00"
  });
  

  useEffect(() => { 
    setFormData({
        id: appointment.id ?? 0,
        dentist_id: appointment.dentist_id ?? 0,
        patient_id: appointment.patient_id ?? 0,
        service_id: appointment.service_id ?? 0,
        appointment_datetime : appointment.appointment_datetime ?? "0000-00-00 00:00:00.123Z",
        appointment_duration: appointment.appointment_duration ?? "00:00:00"
    });
    console.log("appointment", appointment);
    console.log("formData", formData);
      isLoading(true);

      let updated_data = {};

      axios.post(`${BASE_URL}get_next_appointment`,
      {
        "dentist_id" : appointment.dentist_id,
        "patient_id" : appointment.patient_id,
        "service_id" : appointment.service_id,
        "appointment_datetime" :appointment.appointment_datetime
      })
      .then(response => {
        
        if(response.data.error){
          //2nd situation: from existing appointment -> no followup appointment at all
          isDisabledService(true);
  
          setReminder("existing appointment -> no followup appointment at all");
        } else {
          const appointment = new Appointment();
          const app = appointment.parseData(response.data.appointment);

          console.log("appointment", app);
          updated_data = {
            id: app.id,
            dentist_id: app.dentist_id,
            patient_id: app.patient_id,
            service_id: app.service_id,
            appointment_datetime : app.appointment_datetime,
            appointment_duration: app.appointment_duration
          };

          isDisabledService(true);

          setReminder("existing appointment -> have followup appointment odi");
        }  

        axios.post(`${BASE_URL}get_service_by_id`,
        {
          "id" : appointment.service_id
        })
          .then(response => {              
            const service = new Service().parseData(response.data.service);
            
            setService(service);

            updated_data = {
              ...updated_data,
              appointment_duration: service.duration
            };

            
        })
        .catch(error => {
            console.error('Error:', error.message);
        })
        .finally(() => {
          isLoading(false);
        });

        
      })
      .catch(error => {
        console.error('Error:', error);
      })
      .finally(() => {
        if(Object.keys(updated_data).length > 0){
          setFormData({
            ...updated_data,
          });
        }
        
      });

      

      
   
  },[]);

  const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
  };

  
  const handleSubmit = (e) =>{
      e.preventDefault();

      console.log({
        "current_appointment_id": appointment.id,
        "id" : formData.id,
        "dentist_id" : formData.dentist_id,
        "patient_id" : formData.patient_id,
        "service_id" : formData.service_id,
        "appointment_datetime": formData.appointment_datetime,
        "appointment_duration": formData.appointment_duration
      });

      axios.post(`${BASE_URL}set_next_appointment`,
      {
        "current_appointment_id": appointment.id,
        "id" : formData.id,
        "dentist_id" : formData.dentist_id,
        "patient_id" : formData.patient_id,
        "service_id" : formData.service_id,
        "appointment_datetime": formData.appointment_datetime,
        "appointment_duration": formData.appointment_duration
      })
      .then(response => {
        if(response.data.error){
          alert(response.data.error.message + " " + response.data.error.details);
        } else {
          alert("Successful:" + response.data.message + "Appointment ID: (" + response.data.appointment_id + ")");

          navigate("/");
        }
          
      })
      .catch(error => {
          console.error('Error:', error.message);
      });

  }

  return (
    <>
    {loading 
    ? 
    (
      <Loading />
    )
    : (
    <section className='bg-gray-50'>
      <div>
      {JSON.stringify(formData)}
      current appointment id{appointment.id}
      </div>
      <div>{reminder}</div>

      
        
        <div className='flex flex-col justify-center items-center'>
        <div class="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 class="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                {parseInt(formData.id)==0 ? `Create New Appointment #${formData.id}` : `Change Next Appointment #${formData.id}`}
            </h1>  

            <form class="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                <div>
                    <label for="dentist_id" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Dentist</label>  
                    <p>ID: <span className='font-bold text-sm'>{formData.dentist_id == 0 ? dentist.id : formData.dentist_id}</span></p>              
                    <p>Name: <span className='font-bold text-sm'>{dentist.first_name} {dentist.last_name}</span></p>
                    <p>Email: <span className='font-bold text-sm'>{dentist.email}</span></p>
                </div>
                <div>
                    <label for="patient_id" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Patient</label>
                    <input 
                    type="text"
                    name="patient_id"
                    value={formData.patient_id}
                    onChange={handleChange} 
                    class={styles.formField} required 
                    readOnly={formData.patient_id == 0 ? false : true}
                    disabled={formData.patient_id == 0 ? false : true}
                    />
                    
                </div>
                <div>
                    <label for="service_id" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Services</label>
                    <input name="service_id" value={service.name} className={styles.formField} readOnly/>
                </div>
                <div>
                    <label for="appointment_datetime" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Appointment Date & Time</label>
                    <input 
                    type="datetime-local"
                    name="appointment_datetime"
                    min={moment.utc().format('YYYY-MM-DDTHH:mm')}
                    value={moment.utc(formData.appointment_datetime).format('YYYY-MM-DDTHH:mm')}
                    onChange={handleChange} 
                    class={styles.formField} required />

                </div>
                <div>
                    <label for="appointment_duration" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Appointment Duration (HH:MM)</label>
                    <p>{formData.appointment_duration}</p>
                </div>

                <button type="submit" className={styles.primaryButton}>Set Next Appointment</button>
            </form>
          </div>
        </div>
        </div>
        
      
    </section>
    )}</>
  )
}

export default NextAppointment


