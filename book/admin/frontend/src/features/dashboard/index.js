import React, { useState, useEffect } from 'react';
import Axios from 'axios';
import DashboardStats from './components/DashboardStats'
import PageStats from './components/PageStats'

import UserGroupIcon from '@heroicons/react/24/outline/UserGroupIcon'
import CircleStackIcon from '@heroicons/react/24/outline/CircleStackIcon'
import DashboardTopBar from './components/DashboardTopBar'
import { useDispatch } from 'react-redux'
import { showNotification } from '../common/headerSlice'
import LineChart from './components/LineChart'
import BarChart from './components/BarChart'
import DoughnutChart from './components/DoughnutChart'
import UserChannels from './components/UserChannels'

function Dashboard() {
    const [dateValue, setDateValue] = useState({
        startDate: new Date(),
        endDate: new Date()
    });

    const [totalBookings, setTotalBookings] = useState(0);

    useEffect(() => {
        Axios.get('http://127.0.0.1:8000/get_total_appointments_count/')
            .then((response) => {
                const count = response.data.total_count || 0;
                setTotalBookings(count);
            })
            .catch((error) => {
                console.error('Error fetching total bookings count:', error);
            });
    }, []);

    const handleDateChange = (newDateValue) => {
        setDateValue(newDateValue);
    }

    const dispatch = useDispatch()

    const updateDashboardPeriod = (newRange) => {
        dispatch(showNotification({ message: `Period updated to ${newRange.startDate} to ${newRange.endDate}`, status: 1 }))
    }

    const statsData = [
        { title: "Total Bookings", value: totalBookings.toString(), icon: <UserGroupIcon className='w-8 h-8' />, description: "Current month" },
        { title: "Total Cancelation", value: "8", icon: <CircleStackIcon className='w-8 h-8' />, description: "Current month" },
    ];

    return (
        <>
            {/** ---------------------- Select Period Content ------------------------- */}
            <DashboardTopBar updateDashboardPeriod={handleDateChange} />

            {/** ---------------------- Different stats content 1 ------------------------- */}
            <div className="grid lg:grid-cols-4 mt-2 md:grid-cols-2 grid-cols-1 gap-6">
                {
                    statsData.map((d, k) => {
                        return (
                            <DashboardStats key={k} {...d} colorIndex={k} />
                        )
                    })
                }
            </div>

            {/** ---------------------- Different charts ------------------------- */}
            <div className="grid lg:grid-cols-2 mt-4 grid-cols-1 gap-6">
                <LineChart dateRange={dateValue} />
                <BarChart dateRange={dateValue}/>
            </div>

            {/** ---------------------- Different stats content 2 ------------------------- */}
            <div className="grid lg:grid-cols-2 mt-10 grid-cols-1 gap-6">
                
            </div>

            {/** ---------------------- User source channels table  ------------------------- */}
            <div className="grid lg:grid-cols-2 mt-4 grid-cols-1 gap-6">
               
                <DoughnutChart dateRange={dateValue}/>
            </div>
        </>
    )
}

export default Dashboard;
