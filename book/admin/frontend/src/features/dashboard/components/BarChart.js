import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import TitleCard from '../../../components/Cards/TitleCard';
import Axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function BarChart({ dateRange }) {
    const [data, setData] = useState({
        labels: [],
        datasets: [],
    });

    const options = {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          }
        },
    };

    useEffect(() => {
        Axios.get('http://127.0.0.1:8000/get_appointments/')
            .then(response => {
                const appointments = response.data.appointments || [];

                // Filter appointments based on the dateRange
                const filteredAppointments = appointments.filter(appointment => {
                    const appointmentDate = new Date(appointment.appointment_datetime);
                    return appointmentDate >= new Date(dateRange.startDate) && appointmentDate <= new Date(dateRange.endDate);
                });

                const clinicMap = {};
                filteredAppointments.forEach(appointment => {
                    if (!clinicMap[appointment.branch]) {
                        clinicMap[appointment.branch] = 1;
                    } else {
                        clinicMap[appointment.branch]++;
                    }
                });

                const clinicNames = Object.keys(clinicMap);
                const clinicCounts = Object.values(clinicMap);
                
                const datasets = clinicNames.map((clinicName, index) => ({
                    label: clinicName,
                    data: [clinicCounts[index]],
                    backgroundColor: `rgba(${index * 50 + 50}, ${150 - index * 50}, 132, 0.8)`, 
                }));

                setData({
                    labels: ['Clinic Appointments'],
                    datasets: datasets,
                });
            })
            .catch(error => {
                console.error('Error fetching appointment data:', error);
            });
    }, [dateRange]);  // Add dateRange as a dependency to refetch data on date change

    return (
        <TitleCard title={"Bookings Per Clinic"}>
            <Bar options={options} data={data} />
        </TitleCard>
    )
}

export default BarChart;
