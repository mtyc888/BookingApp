import { useNavigate } from 'react-router-dom';
import sparks from '../assets/sparks.png';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {API_URL} from "../config.js";
import {Loading} from "../components/Loading";
import { Branch } from "../models/Appointment.js";
import AppointmentStorage from "../storage.js";
function NewAppointment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [branches, setBranches] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
      //clear everything stored in session storage
      AppointmentStorage.clearAll();

      //start loading the data
      setLoading(true);
      setTimeout(() => {     
        axios.get(`http://127.0.0.1:8000/api/all_branches/`)
        .then((response) => {
            console.log(JSON.stringify(response.data.branches));

            var data = Branch.list(response.data.branches);
            if(data){
            setBranches(data);  
            }
        })
        .catch((error) => {
            console.error('Error fetching branches:', error);
        })
        .finally(() => {
          setLoading(false);
        });
      }, 3000);
      
  }, []);

  return (
    <div className="flex flex-col w-full h-full py-16 px-12">
      <img src={sparks} className="w-[8rem] mb-8"/>
      <h3 className="text-3xl font-bold mb-5">Select an branch</h3>
      
      {loading ? (
          <Loading />
        ) : (
          <div>
            {branches && branches.map((branch) => (
              <div
                key={`branch_${branch.id}`}
                className="bg-zinc-200 text-white hover:bg-zinc-300 w-full cursor-pointer rounded p-3.5 text-left focus:outline-none mb-3"
                role="radio"
                aria-checked="false"
                tabIndex="0"
                aria-labelledby=""
                onClick={() => {
                  AppointmentStorage.setBranch(branch);
                  navigate("/appointment_type");
                }}
              >
                <span className="flex items-center justify-between">
                  <span className="text-neutral-900 ml-3 w-full font-medium">
                    <div className="flex w-full flex-row justify-between">
                      {branch.name}
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
