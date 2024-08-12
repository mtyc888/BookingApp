import {useEffect, useState} from 'react'
import styles from "../styles.js";
import sparks from '../assets/sparks.png';
import moment from "moment";
import { useNavigate } from 'react-router-dom';
import {API_URL} from "../config.js";
import axios from "axios";
import AppointmentStorage from '../storage.js';
import Rodal from 'rodal';

import 'rodal/lib/rodal.css';
function PatientDetails() {

  const [choice, setChoice] = useState(AppointmentStorage.getChoice() || {});
  const [branch, setBranch] = useState(AppointmentStorage.getBranch() || {});
  const [dentist, setDentist] = useState(AppointmentStorage.getDentist() || {});
  const [service, setService] = useState(AppointmentStorage.getService() || {});
  const [appointment_date, setAppointmentDate] = useState(AppointmentStorage.getAppointmentDate() || {});
  const [appointment_time, setAppointmentTime] = useState(AppointmentStorage.getAppointmentTime() || {});

  
  const [showErrorPopup, setShowErrorPopUp] = useState(false);
  const [error_message, setErrorMessage] = useState("");
  const [error_details, setErrorDetails] = useState("");
  const [seconds, setSeconds] = useState(5);

  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    full_name: "",
      email: "",
      phone : 0,
      gender: "male",
      comment: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
  };

  useEffect(() => {
    let timer;
    
    if (showErrorPopup && seconds > 0) {
      timer = setInterval(() => {
        setSeconds((seconds) => seconds - 1);
      }, 1000);
    }
    if (seconds === 0) {
      clearInterval(timer);
      navigate(-1);
    }

    return () => {
      clearInterval(timer);
    };
  }, [showErrorPopup, seconds]);

  const handleSubmit = async (event) => {
      setIsSubmitting(true);

      event.preventDefault(); // Prevent the default form submission

      await axios.post(`${API_URL}/add_appointment`, {
        dentist_id: dentist.id,
        service_id: service.id,
        service_name: service.name,
        branch_name: branch.name,
        appointment_date: appointment_date,
        appointment_time: appointment_time,
        full_name: formData.full_name,
        email: formData.email,
        phone : formData.phone,
        gender: formData.gender,
        comment: formData.comment,
      })
      .then((response) => {
        console.log(JSON.stringify(response.data));
        let data = response.data;

        if(data.error){
          setErrorMessage(data.error.message);
          setErrorDetails(data.error.details);
          setShowErrorPopUp(true);
        } else {
          if(data.appointment_id){
            alert(data.appointment_id);
            navigate("/booking-success");
          } 
        }
        
        
      })
      .catch((error) => {
        console.error('Error: ', error);

        setErrorMessage(error);
        setShowErrorPopUp(true);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
    };

  return (
    <div className='w-full max-w-5xl flex flex-col md:flex-row mx-auto py-16 px-12 gap-12 md:gap-16'>
      <div className='basis-2/3'>

      {/* pop up => when fail to set new appointment */}
      <Rodal
          visible={showErrorPopup}
          onClose={() => {
            setShowErrorPopUp(false);
          }}
          animation='zoom'
          closeOnEsc
        >
          <div className='flex flex-col h-full'>
            <div className="mb-1 text-2xl font-semibold leading-tight lg:text-3xl text-red-600">{error_message ?? "Error"}</div>
            <div className="grow text-md font-semibold">
              Error Details: {error_details ?? "[Error Detail]"} <br/>
              You will be bring back to choose the appointment again</div>
            <button className={styles.primaryButton} onClick={() => {
              setShowErrorPopUp(false);
            }}>
              Go Back in {seconds} s
            </button>
          </div>
        </Rodal>
      {/* pop up => when fail to set new appointment */}

      <button 
      onClick={() => {
        navigate(-1);
      }}
      type="button" className="text-md mb-4 inline-flex cursor-pointer text-zinc-500"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="mr-2 mt-1 h-4"><path fill-rule="evenodd" d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z" clip-rule="evenodd"></path></svg>Back</button>
      <div className="mb-8"><h1 className="mb-1 text-2xl font-semibold leading-tight lg:text-3xl">Please enter your exact information</h1></div>
      
      <form id="patientForm" onSubmit={handleSubmit} method="POST" enctype="multipart/form-data">
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
              <div>
                  <label for="full_name" className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Full Name</label>
                  <input onChange={handleChange}  type="text" name="full_name" className={styles.formField} placeholder="" required/>
              </div>
              <div>
                  <label for="email" className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
                  <input onChange={handleChange}  type="email" name="email"  className={styles.formField} placeholder="" required/>
              </div>
              <div>
                  <label for="phone" className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Phone</label>
                  <input onChange={handleChange}  type="number" name="phone" className={styles.formField} placeholder="" required/>
              </div>
              <div>
                  <label for="gender" className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Gender</label>
                  <select onChange={handleChange} name="gender" className={styles.formField}>
                      <option selected value="male">Male</option>
                      <option value="female">Female</option>
                  </select>
              </div>
              <div className="sm:col-span-2">
                  <label for="comment" className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Comment or special requests <span className='text-grey'>(optional)</span></label>
                  <textarea onChange={handleChange} name="comment" rows="5" className={styles.formField} ></textarea>
              </div>
          </div>
          <button type="submit" className={[styles.primaryButton,'d-flex flex-row items-center justify-center']} disabled={isSubmitting ? true : false}>
            {isSubmitting ? 
              <div
                class="ml-4 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
                role="status">
              </div>
              : "Submit"
            }
          </button>
      </form>
      </div>
      <div className='basis-1/3'>
      <div className="flex rounded-md bg-zinc-100 p-7">
        <div className="flex w-full flex-col break-words pr-2">
          <div className="mb-8">
            <p className="text-sm uppercase text-gray-500">Appointment</p>
            <p className="text-md font-semibold">{choice.name}</p>
            <p className="text-md" data-testid="appointment-card-formatted-time">{moment(appointment_date).format('DD MMM YYYY')} at {appointment_time}</p>
          </div>
          <div className="mb-8">
            <p className="text-sm uppercase text-gray-500">Address</p>
            <p className="font-semibold">{branch.name}</p>
            <div className="text-md">
              <p className="text-md">254 5th Street</p>
              <p className="text-md">San Francisco, CA 94103</p>
              <p className="text-md">(415) 857-0150</p>
            </div>
          </div>
        <div className="inline-flex">
          <div className="relative mr-4">
            <img alt={dentist.name} src={sparks} width="40" height="40" decoding="async" data-nimg="1" className="rounded-full" loading="lazy" style={{color: 'transparent'}}/>
          </div>
          <div>
            <p className="text-sm uppercase text-gray-500">Dentist #{dentist.id}</p>
            <p className="text-md font-semibold">{dentist.first_name} {dentist.last_name}</p>
            <p className="text-sm font-semibold">{dentist.email}</p>
          </div>
        </div>
      </div>
      </div>
      </div>
    </div>
  )
}

export default PatientDetails

//this is for patient to enter their details