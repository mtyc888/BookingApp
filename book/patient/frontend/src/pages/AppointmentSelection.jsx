import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import styles from "../styles.js";
import axios from 'axios';
import {API_URL} from "../config.js";
import {Loading} from "../components/Loading";
import moment from "moment";

import { addDays } from 'date-fns';
import { DateRange  } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css'; 
import AppointmentStorage from '../storage.js';

function AppointmentSelection(){
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [buttonToggle, setButtonToggle] = useState(false);

  let itemsToShowInitially = 4;

  const [expanded, setExpanded] = useState(false);

  const [dentists, setDentists] = useState([]);
  const [state, setState] = useState([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 4),
      key: 'selection'
    }
  ]);

  

  const navigate = useNavigate();
  useEffect(() => {
        let service = AppointmentStorage.getService();
        let branch = AppointmentStorage.getBranch();

        //this means this is from rescheduled cuz cannot select service
        let appointment = AppointmentStorage.getAppointment();
        if(Object.keys(service).length === 0){
          if(appointment != null){
            service = AppointmentStorage.setService({
              id : appointment.service_id,
              name: ''
            });
          }
        }

        setLoading(true);

        setTimeout(() => {     
          axios.post(`${API_URL}/get_appointments`, {
              branch_name: branch.name,
              service_id: service.id, 
              appointment_date: moment(state[0].startDate).format('YYYY-MM-DDTHH:mm:ss.SSSZ')
          })
          .then((response) => {
            setDentists(response.data.appointments); 

            console.log(JSON.stringify(response.data.appointments));
          })
          .catch((error) => {
              console.error('Error fetching appointments:', error);
          })
          .finally(() => {
            setLoading(false);
          });
        }, 1500);

        console.log("startDate", new Date(state[0].startDate), "endDate", new Date(state[0].endDate));
    }, [state[0].startDate]);
    
    function handleSelect(ranges) {
      // Calculate the endDate as 5 days after the selected startDate
      const endDate = new Date(ranges.selection.startDate);
      endDate.setDate(endDate.getDate() + 4);

      // Update the dateRange state with the calculated endDate
      setState([
        {
          startDate: ranges.selection.startDate,
          endDate: endDate,
          key: 'selection',
        },
      ]);
    }

    function handleAppointmentTime(dentist, date, time){
      let choice = AppointmentStorage.getChoice();

      AppointmentStorage.setDentist(dentist);
      AppointmentStorage.setAppointmentDate(moment(date).format("YYYY-MM-DDTHH:mm:ss.SSS"));
      AppointmentStorage.setAppointmentTime(time);
      if(Object.keys(choice).length > 0){
        if(choice.id === 1) { //New appointemnt

          navigate('/patient_details'); 
        } else if(choice.id === 3){ //Rescheduling appointemnt
          
          navigate('/reschedule_confirmation');

        }
      }
    }

    const formattedTime = (inputTime) => moment.utc(inputTime).format('h:mm A');

    return (
    <div className="flex flex-col w-full h-full py-16 px-12">
      <h3 className="text-3xl font-bold mb-5">Select an appointment</h3>
      
      {loading ? (
          <Loading />
        ) : (
          <div className='flex flex-col'>
            
            
            <div className='text-start relative mb-3'>
            <button 
            type="button" aria-expanded="false"
            className="justify-center rounded-full bg-primary-100 px-2 lg:px-4 py-2 text-sm font-medium text-gray-700 shadow hover:shadow-sm focus:shadow-none hover:bg-primary-200 focus:bg-primary-300 focus:outline-none" 
            onClick={() => {
              setButtonToggle(!buttonToggle);
            }}
            >
              <div className="flex justify-between lg:content-center"><span className="self-center">SELECT DATE ({state[0].startDate.toLocaleDateString()} - {state[0].endDate.toLocaleDateString()})</span></div>
            
            </button>
            
            <div className={buttonToggle ? 'block absolute left-0' : 'hidden'}>
              <DateRange
                
                editableDateInputs={false}
                onChange={handleSelect}
                showSelectionPreview={true}
                moveRangeOnFirstSelection={true}
                ranges={state}
                preventSnapRefocus={true}
              />
            </div>
            </div>

            {dentists && dentists.map((dentist, index) => (
              <div key={index} className='mb-3'>
              <p>{dentist.first_name} {dentist.last_name}</p>
              <p>{dentist.email}</p>
              <div className='flex flex-row'>
              {
                dentist.appointments.map((appointment, index) => {
                  const date = appointment.date;
                  const apps = appointment.appointments;
                  // console.log(`Appointment ${index + 1} date: ${date}`);
                  return (
                    <div key={index} className='flex-1'>
                    <p >{ moment(date).format("Do MMM")} </p>
                    
                    <div className='flex flex-col text-sm' style={{flex: 1}}>
                        <Appointments apps={!expanded ? apps.slice(0, itemsToShowInitially) : apps} handleAppointmentTime={handleAppointmentTime} dentist={dentist} date={date}/>
                        {/* {
                         
                          apps.map((app_time, app_time_index) => {
                            return (
                              <button key={app_time_index} type="button" className={styles.primaryButton} onClick={() => {
                                handleAppointmentTime(dentist, date, app_time)
                              }}>
                                {app_time}
                              </button>
                            );
                          })
                        } */}
                    </div>
                    </div>
                  );
                })
              }

              
              </div>
              
              <button className="text-lg text-red-400" onClick={() => {
                setExpanded(!expanded);

              }}>{ !expanded ? "Show More" : "Show Less"}</button>
            

              </div>
            ))}
          </div>
        )}

    </div>
    );
}

export default AppointmentSelection;

const Appointments = ({ apps, handleAppointmentTime, dentist, date }) => {  

  if (apps.length === 0) {
    return <p className='text-lg'>......</p>;
  }

  return (
    <div>
      {apps.map((app_time, app_time_index) => {
        return (
          <button key={app_time_index} type="button" className="w-full text-white bg-primary-400 hover:bg-primary-700 font-medium rounded-lg text-xs p-3 text-center" onClick={() => {
            handleAppointmentTime(dentist, date, app_time)
          }}>
            {app_time}
          </button>
        );
      })}

    </div>
  );
};


