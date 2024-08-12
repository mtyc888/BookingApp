import React, {useState, useEffect} from 'react'
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import styles from "../styles.js";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import {JwtTokenManager, UserManager} from '../storage';
import {Appointment} from "../models.js";
import { BASE_URL } from '../App.js';

function TimeTable({initialView = 'timeGridWeek', initialDate = Date.now()}) {
  const navigate = useNavigate();
  const [loading, isLoading] = useState(false); 
  const [eventData, setEventData] = useState([]);
  const [error, isError] = useState(false);   

  useEffect(() => {  
    loadData(); 

    console.log("eventData" + JSON.stringify(eventData));
  }, []);

  // Define the function to handle event clicks
  function handleEventClick(info) {
      console.log('Event clicked: ' + info.event.id);

      if(info.event.id){
        navigate("/appointments/" + info.event.id);
      }
  }

  function getEndTime(startTime, duration){
    console.log("startTime " + startTime);

    const datetime = new Date(startTime);
    const durationParts = duration.split(":");
    const hours = parseInt(durationParts[0]);
    const minutes = parseInt(durationParts[1]);
    const seconds = parseInt(durationParts[2]);

    // Add the duration to the datetime
    datetime.setUTCHours(datetime.getUTCHours() + hours);
    datetime.setUTCMinutes(datetime.getUTCMinutes() + minutes);
    datetime.setUTCSeconds(datetime.getUTCSeconds() + seconds);

    const formatedDate = datetime.toISOString();

    return formatedDate;
  }

  function loadData() {
    const jwtManager = new JwtTokenManager();
    const token = jwtManager.getToken();
    const userManager = new UserManager();
    const user = userManager.getUser();

    console.log({
      "dentist_id" : user.id
    });
    
    axios.post(`${BASE_URL}get_appointments`,
    {
      "dentist_id" : user.id
    })
    .then(response => {
      
      if(response.data.appointments){
      isError(false);

      const events = [];
      response.data.appointments.map((appointment) => {
        const app = new Appointment();
        const returned = app.parseData(appointment);
        
        const json = {
          id: returned.id,
          title: `Appointment ${returned.id}`,
          start: returned.appointment_datetime,
          end: getEndTime(returned.appointment_datetime, returned.appointment_duration),
          patient_id: returned.patient_id
        };
        events.push(json);
      });

      setEventData(events); // just something extra     

      var calendarEl = document.getElementById('calendar');
      const calendar = new Calendar(calendarEl, {
        timeZone: 'UTC',
        plugins: [ dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
        initialView: initialView,
        initialDate: initialDate,
        events: events,
        eventClick: handleEventClick,
        dateClick: (arg) => {
          console.log(JSON.stringify(arg))
          // Extract the clicked date from the event argument
          const clickedDate = arg.date;

          // Get the FullCalendar API instance
          const calendarApi = arg.view.calendar;

          // Switch to the timeGridDay view for the clicked date
          calendarApi.changeView('timeGridDay', clickedDate);
        },
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        // customButtons: {
        //     addNew: {
        //         text: 'New Appointment',
        //         click: function() {
        //             navigate("/appointments/next");
        //         }
        //     }
        // },
        editable: false,
        
        
      // requires premium ver.
        businessHours: [
          {
            daysOfWeek: [1, 2, 3, 4, 5], // 0 = Sunday, ..., 6 = Saturday
            startTime: '08:00', 
            endTime: '17:00'   
          },
          {
            daysOfWeek: [ 6, 7 ], 
            startTime: '08:00', 
            endTime: '08:00'
          }
        ],
        windowResize: () => {
          calendar.updateSize(); // This triggers a re-render of the calendar
        },
      });
      //render calendar
      calendar.render();
      
      }
    })
    .catch(error => {
        console.error('Error:', error);
        isError(true);
    })
    .finally(() => {
      isLoading(false); 
    });
  }

  return (
    <div>
      <div id="calendar">
        {error ? (<h1>Error</h1>) : (<div></div>)}
      </div>
    </div>
  )
}

export default TimeTable;