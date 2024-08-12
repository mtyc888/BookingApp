import {useState} from 'react'
import sparks from "../assets/sparks.png";
import moment from "moment";
import AppointmentStorage from '../storage.js';

function BookingSuccess() {
  const [choice, setChoice] = useState(AppointmentStorage.getChoice() || {});
  const [branch, setBranch] = useState(AppointmentStorage.getBranch() || {});
  const [dentist, setDentist] = useState(AppointmentStorage.getDentist() || {});
  const [service, setService] = useState(AppointmentStorage.getService() || {});
  const [appointment_date, setAppointmentDate] = useState(AppointmentStorage.getAppointmentDate() || {});
  const [appointment_time, setAppointmentTime] = useState(AppointmentStorage.getAppointmentTime() || {});

  return (
    <section className="p-6 md:py-20">
      <div className="flex flex-col max-w-2xl mx-auto">
        <img src={sparks} className='w-32 mb-8 mx-auto'/>

        <h1 className='text-2xl md:text-3xl font-bold mb-12 mx-auto'>Your appointment has been scheduled!</h1>
        <div className="w-full flex rounded-md bg-zinc-100 p-7">
            <div className="flex w-full flex-col break-words pr-2">
            <div className="mb-8">
                <p className="text-sm uppercase text-gray-500">Appointment</p>
                <p className="text-md font-semibold">{choice.name}</p>
                <p className="text-md" data-testid="appointment-card-formatted-time">{moment(appointment_date).format('DD MMM YYYY')} at {appointment_time}</p>
            </div>
            <div className="mb-8">
                <p className="text-sm uppercase text-gray-500">Address</p>
                <p className="font-semibold">{branch.name}</p>
                <div className="text-md">
                <p className="text-md">254 5th Street</p>
                <p className="text-md">San Francisco, CA 94103</p>
                <p className="text-md">(415) 857-0150</p>
                </div>
            </div>
            <div className="inline-flex">
            <div className="relative mr-4">
                <img alt={dentist.name} src={sparks} width="40" height="40" decoding="async" data-nimg="1" className="rounded-full" loading="lazy" style={{color: 'transparent'}}/>
            </div>
            <div>
                <p className="text-sm uppercase text-gray-500">Dentist #{dentist.id}</p>
                <p className="text-md font-semibold">{dentist.first_name} {dentist.last_name}</p>
                <p className="text-sm font-semibold">{dentist.email}</p>
            </div>
            </div>
        </div>
        </div>
      </div>
      </section>
  )
}

export default BookingSuccess;