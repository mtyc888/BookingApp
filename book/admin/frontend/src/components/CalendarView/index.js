import React, { useState, useEffect } from 'react';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { JwtTokenManager } from '../storage';

function TimeTable({ initialView = 'timeGridWeek', initialDate = Date.now() }) {
    const navigate = useNavigate();
    const [eventData, setEventData] = useState([]);
    const [error, setError] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    function handleEventClick(info) {
        console.log('Event clicked: ' + info.event.id);
        if (info.event.id) {
            navigate("/appointments/" + info.event.id);
        }
    }

    function getEndTime(startTime, duration) {
      console.log("startTime " + startTime);

      const datetime = new Date(startTime);
      const durationParts = duration.split(":");
      const hours = parseInt(durationParts[0]);
      const minutes = parseInt(durationParts[1]);
      const seconds = parseInt(durationParts[2]);

      datetime.setUTCHours(datetime.getUTCHours() + hours);
      datetime.setUTCMinutes(datetime.getUTCMinutes() + minutes);
      datetime.setUTCSeconds(datetime.getUTCSeconds() + seconds);

      return datetime.toISOString();
  }

  function loadData() {
    const jwtManager = new JwtTokenManager();
    const token = jwtManager.getToken();

    axios.get('http://127.0.0.1:8000/api/get_all_appointment_slots/', { 
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        // Check the structure of the response
        console.log("API Response:", response.data);  // Debugging line

        const appointments = response.data.appointment_slots; // Adjusted to match the key in the JSON response

        if (!appointments || !Array.isArray(appointments)) {
            console.error('Unexpected data structure:', appointments);
            return;
        }

        console.log("Fetched Appointments:", appointments);  // Debugging line

        // Assuming each appointment has an 'is_available' field
        const filteredAppointments = appointments.filter(appointment => {
            // Directly filtering on 'is_available'
            return appointment.is_available === false;
        });

        console.log("Filtered Appointments:", filteredAppointments);  // Debugging line

        const events = filteredAppointments.map((appointment) => ({
            start: appointment.start_time,
            end: appointment.end_time
        }));

        setEventData(events);

        var calendarEl = document.getElementById('calendar');
        const calendar = new Calendar(calendarEl, {
            timeZone: 'UTC',
            plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
            initialView: initialView,
            initialDate: initialDate,
            events: events,
            eventClick: handleEventClick,
            dateClick: (arg) => {
                console.log(JSON.stringify(arg));
                const clickedDate = arg.date;
                const calendarApi = arg.view.calendar;
                calendarApi.changeView('timeGridDay', clickedDate);
            },
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'addNew,rescheduleAppointment dayGridMonth,timeGridWeek,timeGridDay'
            },
            customButtons: {
                addNew: {
                    text: 'New Appointment',
                    click: function() {
                        navigate("/nextappointment");
                    }
                },
                rescheduleAppointment: {
                    text: 'Reschedule Appointment',
                    click: function() {
                        navigate("/reschedule");
                    }
                }
            },                
            editable: false,
            businessHours: [
                {
                    daysOfWeek: [1, 2, 3, 4, 5],
                    startTime: '08:00',
                    endTime: '17:00'
                },
                {
                    daysOfWeek: [6, 7],
                    startTime: '08:00',
                    endTime: '08:00'
                }
            ],
            windowResize: () => {
                calendar.updateSize();
            }
        });
        calendar.render();
    })
    .catch(err => {
        console.error('Error:', err);
        setError(true);
    });
}

    return (
        <div>
            <div id="calendar">
                {error ? (<h1>{error.message}</h1>) : null}
            </div>
        </div>
    )
}

export default TimeTable;
