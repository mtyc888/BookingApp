import { useNavigate, useParams } from 'react-router-dom';
import sparks from '../assets/sparks.png';
import { useEffect, useState } from 'react';
import styles from "../styles.js";
import axios from 'axios';
import {API_URL} from "../config.js";
import {Loading} from "../components/Loading";
import AppointmentStorage from '../storage.js';
import {Appointment} from '../models/Appointment.js';
function RescheduleAppointment() {

const [loading, setLoading] = useState(false);
const [booking_reference, setBookingReference] = useState("");

    const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingReference(value);
    };

const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    setIsSubmitting(true);

    event.preventDefault(); // Prevent the default form submission


    setTimeout(() => {     
        axios.post(`${API_URL}/validate_booking_reference`, {
            branch_name: AppointmentStorage.getBranch().name,
            booking_reference: booking_reference
        })
        .then((response) => {
            if(response.data.success == true){
                //set appointment id and brings him to pick a new time
                console.log(response.data.data);
                
                let appointment = response.data.data;
                appointment = new Appointment({
                    id: response.data.data.id,
                    dentist_id: response.data.data.dentist_id,
                    patient_id: response.data.data.patient_id,
                    service_id: response.data.data.service_id,
                    appointment_datetime: response.data.data.appointment_datetime,
                    appointment_duration: response.data.data.appointment_duration,
                    status: response.data.data.status,
                    booking_reference: response.data.data.booking_reference,
                    branch: response.data.data.branch,
                    reason: response.data.data.reason
                });

                AppointmentStorage.setBookingReference(booking_reference);
                AppointmentStorage.setAppointment(appointment);
                AppointmentStorage.setService({
                    id: response.data.data.service_id,
                    name: ''
                });

                //bring to AppointmentSelection
                navigate("/appointment_selection");
            } else {
                alert(response.data.error.message);
            }
        })
        .catch((error) => {
            console.error('Error validating url:', error);
        })
        .finally(() => {
            setIsSubmitting(false);
        });
    }, 3000);
  };

  return (
    <>
    {loading ? (
        <Loading />
      ) : (
        <div className="flex flex-col w-full h-full py-16 px-12">
            
            <img src={sparks} className="w-[8rem] mb-8"/>
            <h3 className="text-3xl font-bold mb-5">Reschedule Appointment</h3>
            <form id="cancelBookingForm" onSubmit={handleSubmit} method="POST" enctype="multipart/form-data">
            
            <div className="flex w-full flex-col break-words mb-8">
                <label for="booking_reference" className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Booking Reference</label>
                <input onChange={handleChange}  type="text" name="booking_reference" className={styles.formField} placeholder="" required/>
            </div>

            <button type="submit" className={[styles.primaryButton,'d-flex flex-row items-center justify-center']} disabled={isSubmitting ? true : false}>
                {isSubmitting ? 
                    <div
                    class="ml-4 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status">
                    </div>
                    : "Reschedule Booking"
                }
                </button>
            </form>
            </div>
            )}
        </>
)}

export default RescheduleAppointment;