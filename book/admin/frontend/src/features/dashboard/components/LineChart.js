import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import TitleCard from '../../../components/Cards/TitleCard';
import Axios from 'axios';
import { format } from 'date-fns'; // Import the format function from date-fns

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

function LineChart({ dateRange }) {
  const [appointmentData, setAppointmentData] = useState([]);
  const [labels, setLabels] = useState([]);
  const [totalAppointmentsCount, setTotalAppointmentsCount] = useState(0);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      x: {
        type: 'category',
        labels: labels,
      },
      y: {
        suggestedMin: 0,
        suggestedMax: totalAppointmentsCount,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Total Appointments',
        },
      },
    },
  };

  useEffect(() => {
    Axios.get('http://127.0.0.1:8000/get_appointments/')
      .then((response) => {
        const data = response.data.appointments || [];

        // Filter the data based on the dateRange prop
        const filteredData = data.filter(appointment => {
            const appointmentDate = new Date(appointment.appointment_datetime);
            return appointmentDate >= new Date(dateRange.startDate) && appointmentDate <= new Date(dateRange.endDate);
        });

        const appointmentLabels = filteredData.map((appointment) =>
          format(new Date(appointment.appointment_datetime), "dd/MM/yyyy")
        );
        const appointmentValues = filteredData.map((appointment) => appointment.patient_id);
        setLabels(appointmentLabels);
        setAppointmentData(appointmentValues);
        console.log("Appoint LINE: ", appointmentValues)
        fetchTotalAppointmentsCount();
      })
      .catch((error) => {
        console.error('Error fetching appointment data:', error);
      });
  }, [dateRange]);

  const fetchTotalAppointmentsCount = () => {
    Axios.get('http://127.0.0.1:8000/get_total_appointments_count/')
      .then((response) => {
        const count = response.data.total_count || 0;
        setTotalAppointmentsCount(count);

        const newYScale = {
          ...options.scales.y,
          suggestedMax: count,
        };
        options.scales.y = newYScale;
      })
      .catch((error) => {
        console.error('Error fetching total appointments count:', error);
      });
  };

  const data = {
    labels: labels,
    datasets: [
      {
        fill: true,
        label: 'MAU',
        data: appointmentData, 
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  return (
    <TitleCard title={'Total Bookings'}>
      <Line data={data} options={options} />
    </TitleCard>
  );
}

export default LineChart;
