import { useNavigate } from 'react-router-dom';
import sparks from '../assets/sparks.png';
import { useEffect, useState } from 'react';
import styles from "../styles.js";
import axios from 'axios';
import {API_URL} from "../config.js";
import {Loading} from "../components/Loading";
import AppointmentStorage from "../storage.js";

function ExistingAppointment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const navigate = useNavigate();
  useEffect(() => {
      setLoading(true);
      setTimeout(() => {     
        axios.post(`${API_URL}/get_appointment`)
        .then((response) => {

        })
        .catch((error) => {
            console.error('Error fetching services:', error);
        })
        .finally(() => {
          setLoading(false);
        });
      }, 3000);
  }, []);

  return (
    <div className="flex flex-col w-full h-full py-16 px-12">
      <img src={sparks} className="w-[8rem] mb-8"/>
      <h3 className="text-2xl font-bold mb-5">Existing Appointment</h3>
      <p></p>
      
      {loading ? (
          <Loading />
        ) : (
          <div>
            
          </div>
        )}

    </div>
  )
}

export default ExistingAppointment;