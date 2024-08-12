import { useNavigate, useParams } from 'react-router-dom';
import sparks from '../assets/sparks.png';
import { useEffect, useState } from 'react';
import styles from "../styles.js";
import axios from 'axios';
import {API_URL} from "../config.js";
import {Loading} from "../components/Loading";

function CancelAppointment() {

const [loading, setLoading] = useState(false);
const [cancellation_token, setCancellation_token] = useState(null);
const [booking_reference, setBookingReference] = useState("");

const searchParams = new URLSearchParams(window.location.search);
useEffect(() => {
    
    setLoading(true);
    setCancellation_token(searchParams.get('token'));
    console.log(searchParams.get('token'));
    if(searchParams.get('token') == null){
      //ask user to enter appointment id
      setLoading(false);
    } else {
      setTimeout(() => {     
      axios.post(`${API_URL}/validate_cancellation_token`, {
          cancellation_token: searchParams.get('token')
      })
      .then((response) => {
          if(response.data.success == true){
              setBookingReference(response.data.data.booking_reference);
          } else {
              console.log(response.data);
              alert(response.data.error.message);
              navigate('/expired_link');
          }
      })
      .catch((error) => {
          console.error('Error validating url:', error);

          navigate('/expired_link');
      })
      .finally(() => {
          setLoading(false);
      });
      }, 3000);
    }

},[]);


const handleChange = (e) => {
  const { name, value } = e.target;
  setBookingReference(value);
};


const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    setIsSubmitting(true);

    event.preventDefault(); // Prevent the default form submission

    await axios.post(`${API_URL}/cancel_appointment`, {
      booking_reference: booking_reference,
    })
    .then((response) => {
      if(response.data.success){
        alert(response.data.message);

        //bring to cancel success
        navigate("/");

      } else {
        alert(response.data.message);

        //bring to cancel failed
      }
    })
    .catch((error) => {
      console.error('Error: ', error);

    })
    .finally(() => {
      setIsSubmitting(false);
    });
  };

  return (
    <>
    {loading ? (
        <Loading />
      ) : (
        <div className="flex flex-col w-full h-full py-16 px-12">
            <img src={sparks} className="w-[8rem] mb-8"/>
            <h3 className="text-3xl font-bold mb-5">Cancel Appointment</h3>
            <form id="cancelBookingForm" onSubmit={handleSubmit} method="POST" enctype="multipart/form-data">
            <p className='text-md font-bold text-red-500'>!!! This Action is not reversible.</p>
            <div className='mb-16'>Are you sure you want to cancel this booking?</div>
            
            <div className="flex w-full flex-col break-words">
                {cancellation_token == null ? (
                  <div>
                      <label for="booking_reference" className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Booking Reference</label>
                      <input onChange={handleChange}  type="text" name="booking_reference" className={styles.formField} placeholder="" required/>
                  </div>
                ) : (
                  <div className="mb-8">
                      <p className="text-sm uppercase text-gray-500">Appointment</p>
                      <p className="text-md font-semibold">{booking_reference}</p>
                      <p className="text-md">[datetime]</p>
                  </div>
                )}


                <div className="mb-8">
                    <p className="text-sm uppercase text-gray-500">Address</p>
                    <p className="font-semibold">[branch name]</p>
                    <div className="text-md">
                    <p className="text-md">254 5th Street</p>
                    <p className="text-md">San Francisco, CA 94103</p>
                    <p className="text-md">(415) 857-0150</p>
                    </div>
                </div>
                </div>

            <button type="submit" className={[styles.primaryButton,'d-flex flex-row items-center justify-center']} disabled={isSubmitting ? true : false}>
                {isSubmitting ? 
                    <div
                    class="ml-4 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status">
                    </div>
                    : "Confirm Cancel Booking"
                }
                </button>
            </form>
            </div>
            )}
        </>
)}

export default CancelAppointment;