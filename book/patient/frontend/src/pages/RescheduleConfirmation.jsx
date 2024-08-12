import { useNavigate, useParams } from 'react-router-dom';
import sparks from '../assets/sparks.png';
import { useEffect, useState } from 'react';
import styles from "../styles.js";
import axios from 'axios';
import {API_URL} from "../config.js";
import {Loading} from "../components/Loading";
import AppointmentStorage from '../storage';
import moment from "moment";
import { Appointment } from '../models/Appointment';

function RescheduleConfirmation() {

const [isSubmitting, setIsSubmitting] = useState(false);
const [ori_appt, setOriAppointment] = useState(AppointmentStorage.getAppointment() ?? new Appointment()); //for display purposes only

const [booking_reference, setBookingReference] = useState(AppointmentStorage.getBookingReference() ?? "");
const [appointment_date, setAppointmentDate] = useState(AppointmentStorage.getAppointmentDate() ?? "");
const [appointment_time, setAppointmentTime] = useState(AppointmentStorage.getAppointmentTime() ?? "");
const [dentist_id, setDentistID] = useState(AppointmentStorage.getDentist().id ?? 0);

  const navigate = useNavigate();
  
  function getEndTime(){
    const startTime = moment(ori_appt.appointment_datetime);
    const duration = moment.duration(ori_appt.appointment_duration);
    
    return startTime.add(duration) ?? moment.now();
  }

  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const handleCheckboxChange = (e) => {
    setIsCheckboxChecked(e.target.checked);
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent the default form submission


    if(isCheckboxChecked){
      setIsSubmitting(true);

      axios.post(`${API_URL}/reschedule_appointment`, {
        booking_reference: booking_reference,
        appointment_date: appointment_date,
        appointment_time: appointment_time,
        dentist_id: dentist_id
      })
      .then((response) => {
        if(response.data.success){
          alert(response.data.message);

          //bring to success

          navigate("/booking-success");
        } else {
          alert(response.data.error.message);

          //bring to cancel failed
        }
      })
      .catch((error) => {
        console.error('Error: ', error);

      })
      .finally(() => {
        setIsSubmitting(false);
      });
    }
  };

  return (
    <>
    <div className="flex flex-col w-full h-full py-16 px-12">
            <img src={sparks} className="w-[8rem] mb-8"/>

            
            <h3 className="text-3xl font-bold mb-5">Reschedule Appointment</h3>
            <form id="cancelBookingForm" onSubmit={handleSubmit} method="POST" enctype="multipart/form-data">
            <p className='text-md font-bold text-red-500'>!!! This Action is not reversible.</p>
            <div className='mb-16'>Are you sure you want to reschedule this booking?</div>
            
            <div className="flex w-full flex-col break-words">
                <h3>Please check your details</h3>
                <div className="mb-8">
                      <p className="text-sm uppercase text-gray-500">Appointment</p>
                      <p className="text-md font-semibold mb-8">{booking_reference}</p>

                      <p className='text-md font-semibold'>Reschedule</p>
                      <p className='text-red-500 text-md'>From</p>
                      <p className="text-md">{moment(ori_appt.appointment_datetime).format('DD MMM YYYY')} at {moment(ori_appt.appointment_datetime).format('hh:mm A')} - {moment(getEndTime()).format('hh:mm A')}</p>
                      <p className='text-red-500 text-md'>To</p>
                      <p className="text-md">{moment(appointment_date).format('DD MMM YYYY')} at {appointment_time}</p>

                  </div>


                <div className="mb-8">
                    <p className="text-sm uppercase text-gray-500">Address</p>
                    <p className="font-semibold">{AppointmentStorage.getBranch().name}</p>
                    <div className="text-md">
                    <p className="text-md">254 5th Street</p>
                    <p className="text-md">San Francisco, CA 94103</p>
                    <p className="text-md">(415) 857-0150</p>
                    </div>
                </div>
            </div>

            <div className='flex flex-row mb-3'>
              <input type="checkbox" className='me-2' checked={isCheckboxChecked} onChange={handleCheckboxChange}/>
              <p className="text-sm">I'm sure the above details is correct and I still want to reschedule the appointment.</p>
            </div>

            <button type="submit" className={[styles.primaryButton,'d-flex flex-row items-center justify-center']} disabled={isSubmitting ? true : false}>
                {isSubmitting ? 
                    <div
                    class="ml-4 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status">
                    </div>
                    : "Reschdule"
                }
                </button>
            </form>
            </div>

    </>
)}

export default RescheduleConfirmation;