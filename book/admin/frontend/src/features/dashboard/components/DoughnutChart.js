import React, { useState, useEffect } from 'react';
import Axios from 'axios';
import { Doughnut } from 'react-chartjs-2';
import TitleCard from '../../../components/Cards/TitleCard';
import { Chart, ArcElement } from 'chart.js';
Chart.register(ArcElement);

function DoughnutChart({ dateRange }) {
    const [services, setServices] = useState([]);
    const [appointments, setAppointments] = useState([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const servicesResponse = await Axios.get('http://127.0.0.1:8000/get_services/');
                const fetchedServices = servicesResponse.data?.services?.map(service => service.name.trim()) || []; // trim to avoid whitespace issues
                console.log("Fetched Services:", fetchedServices);

                const appointmentsResponse = await Axios.get('http://127.0.0.1:8000/get_appointments/');
                const fetchedAppointments = appointmentsResponse.data?.appointments || [];
                const filteredAppointments = fetchedAppointments.filter(appointment => {
                    const appointmentDate = new Date(appointment.appointment_datetime);
                    return appointmentDate >= new Date(dateRange.startDate) && appointmentDate <= new Date(dateRange.endDate);
                });
                console.log("Filtered Appointments:", filteredAppointments);

                setServices(fetchedServices);
                setAppointments(filteredAppointments);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }

        fetchData();
    }, [dateRange]);

    const serviceCounts = services.map(service => {
        const count = appointments.filter(appointment => appointment.reason.trim().toLowerCase() === service.toLowerCase()).length;
        console.log(`Service: ${service}, Count: ${count}`);
        return count;
    });
    

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
        },
    };

    const data = {
        labels: services,
        datasets: [
            {
                label: '# of Orders',
                data: serviceCounts,
                backgroundColor: [
                  'rgba(255, 99, 132, 0.8)',
                  'rgba(54, 162, 235, 0.8)',
                  'rgba(255, 206, 86, 0.8)',
                  'rgba(75, 192, 192, 0.8)',
                  'rgba(153, 102, 255, 0.8)',
                  'rgba(255, 159, 64, 0.8)',
                ],
                borderColor: [
                  'rgba(255, 99, 132, 1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(75, 192, 192, 1)',
                  'rgba(153, 102, 255, 1)',
                  'rgba(255, 159, 64, 1)',
                ],
                borderWidth: 1,
            }
        ],
    };

    return (
        <TitleCard title={"Orders by Category"}>
            {services.length > 0 && appointments.length > 0 && (
                <Doughnut options={options} data={data} />
            )}
        </TitleCard>
    );
}

export default DoughnutChart;
