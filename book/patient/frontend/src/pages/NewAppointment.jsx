import { useNavigate } from 'react-router-dom';
import sparks from '../assets/sparks.png';
import { useEffect, useState } from 'react';
import styles from "../styles.js";
import axios from 'axios';
import {API_URL} from "../config.js";
import {Loading} from "../components/Loading";
import AppointmentStorage from "../storage.js";

function NewAppointment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [services, setServices] = useState([]);

  const navigate = useNavigate();
  useEffect(() => {
      setLoading(true);
      setTimeout(() => {     
        axios.get(`${API_URL}/all_services`)
        .then((response) => {
            setServices(response.data.services);  
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
      <h3 className="text-3xl font-bold mb-5">Select an service</h3>
      
      {loading ? (
          <Loading />
        ) : (
          <div>
            {services && services.map((service) => (
              <div
                key={`service_${service.id}`}
                className="bg-zinc-200 text-white hover:bg-zinc-300 w-full cursor-pointer rounded p-3.5 text-left focus:outline-none mb-3"
                role="radio"
                aria-checked="false"
                tabIndex="0"
                aria-labelledby=""
                onClick={() => {
                  AppointmentStorage.setService(service);
                  navigate("/appointment_selection");
                }}
              >
                <span className="flex items-center justify-between">
                  <span className="text-neutral-900 ml-3 w-full font-medium">
                    <div className="flex w-full flex-row justify-between">
                      {service.name}
                    </div>
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}

    </div>
  )
}

export default NewAppointment;
