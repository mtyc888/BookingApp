import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { UserManager } from '../../components/storage';
import styles from "../../components/styles";

function NextAppointment() {
    const navigate = useNavigate();
    const userManager = new UserManager();
    const { state } = useLocation();
    const [patientID, setPatientID] = useState(state?.patientID || 0);
    const [isPatientAdded, setIsPatientAdded] = useState(localStorage.getItem('isPatientAdded') === 'true');
    const [dentists, setDentists] = useState([]);
    const [services, setServices] = useState([]);
    const [branches, setBranches] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);

    const [patientData, setPatientData] = useState({
        full_name: "",
        phone: "",
        email: ""
    });

    const [appointmentData, setAppointmentData] = useState({
        date: "",
        time: "",
        service_id: "",
        dentist_id: "",
        branch_id: "",
        reason: ""
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const responseDentists = await fetch("http://127.0.0.1:8000/get_dentists/");
                const dataDentists = await responseDentists.json();
                setDentists(dataDentists.dentists || []);

                const responseServices = await fetch("http://127.0.0.1:8000/get_services/");
                const dataServices = await responseServices.json();
                setServices(dataServices.services || []);

                const responseBranches = await fetch("http://127.0.0.1:8000/get_branches/");
                const dataBranches = await responseBranches.json();
                setBranches(dataBranches || []);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        const fetchSlots = async () => {
            console.log('date: ', appointmentData.date);
            if (appointmentData.date && appointmentData.service_id) {
                console.log('entered');
                try {
                    const response = await axios.get('http://127.0.0.1:8000/api/appointment-slots/', {
                        params: {
                            date: appointmentData.date,
                            service_id: appointmentData.service_id,
                        }
                    });
                    console.log('Fetched Slots:', response.data.slots); // Debugging line
                    setAvailableSlots(response.data.slots || []);
                } catch (error) {
                    console.error('Error fetching appointment slots:', error.response || error.message);
                }
            }
        };
    
        fetchSlots();
    }, [appointmentData.date, appointmentData.service_id]);

    const handlePatientChange = (e) => {
        const { name, value } = e.target;
        setPatientData(prev => ({ ...prev, [name]: value }));
    };

    const handleAppointmentChange = (e) => {
        const { name, value } = e.target;
        console.log(`Setting ${name} to ${value}`); // Debugging line
        setAppointmentData(prev => ({ ...prev, [name]: value }));
    };

    const handlePatientSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://127.0.0.1:8000/add_patient/", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(patientData)
            });

            const data = await response.json();
            if (data.id) {
                setPatientID(data.id);
                setIsPatientAdded(true);
                localStorage.setItem('isPatientAdded', 'true');
                alert("Patient added successfully!");
            } else {
                alert("Error adding patient: " + data.error);
            }
        } catch (error) {
            alert("There was an error: " + error);
        }
    };

    const goBackToAddPatient = () => {
        setIsPatientAdded(false);
        localStorage.removeItem('isPatientAdded');
    };

    const handleAppointmentSubmit = async (e) => {
        e.preventDefault();

        if (patientID === 0) {
            alert("Please add a patient first.");
            return;
        }

        const selectedService = services.find(service => service.id.toString() === appointmentData.service_id);
        if (!selectedService) {
            alert("Please select a service.");
            return;
        }

        // Convert slot IDs to an array of integers
        const slotIds = appointmentData.time.split(',').map(id => parseInt(id));
        console.log("Slot IDs:", slotIds); // Debugging line
        console.log("Available Slots:", availableSlots); // Debugging line

        // Find the first slot that contains the ID
        const firstSlot = availableSlots.find(slot => slot.id.includes(slotIds[0]));
        console.log("firstSlot: ", firstSlot); // This should now show the correct slot object

        if (!firstSlot) {
            console.log("No matching slot found for ID:", slotIds[0]);
            alert("Invalid time slot selection.");
            return;
        }

        // Construct the appointment datetime string
        const appointmentDatetime = `${appointmentData.date}T${firstSlot.start_time}:00.000Z`;

        try {
            const response = await fetch("http://127.0.0.1:8000/add_appointment/", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    patient_id: patientID,
                    service_id: selectedService.id,
                    dentist_id: appointmentData.dentist_id,
                    branch_id: appointmentData.branch_id,
                    reason: selectedService.name,
                    appointment_datetime: appointmentDatetime,
                    appointment_duration: selectedService.duration,
                    status: 'P', // Assuming 'P' is a valid status
                    branch: branches.find(branch => branch.id.toString() === appointmentData.branch_id)?.branch_name || "",
                    slot_ids: slotIds
                })
            });

            const data = await response.json();
            if (response.ok && data.id) {
                alert("Appointment added successfully!");
                navigate('/appointments');
            } else {
                alert("Failed to add appointment: " + data.error);
            }
        } catch (error) {
            console.error("Error adding appointment:", error);
            alert("An error occurred. Please try again.");
        }
    };

    const renderSlots = () => {
        if (!availableSlots.length) {
            return <div>No available slots for the selected date and service.</div>;
        }

        return (
            <select
                name="time"
                value={appointmentData.time}
                onChange={handleAppointmentChange}
                className={styles.formField}
                required
            >
                <option value="">Select a time slot</option>
                {availableSlots.map((slot, index) => (
                    <option key={index} value={slot.id}>
                        {`${slot.start_time} - ${slot.end_time}`}
                    </option>
                ))}
            </select>
        );
    };

    if (isPatientAdded) {
        return (
            <section className='bg-gray-50'>
                <div className='flex flex-col justify-center items-center'>
                    <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
                        <button onClick={goBackToAddPatient} className={styles.secondaryButton}>{"<--- Go Back"}</button>
                        <div className="p-6 space-y-4 md:space-y-6">
                            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                                Add New Appointment
                            </h1>
                            <form className="space-y-4 md:space-y-6" onSubmit={handleAppointmentSubmit}>
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Reason</label>
                                    <select 
                                        name="service_id" 
                                        value={appointmentData.service_id} 
                                        onChange={handleAppointmentChange} 
                                        className={styles.formField} 
                                        required
                                    >
                                        <option value="">Select a Service</option>
                                        {services.map(service => (
                                            <option key={service.id} value={service.id}>{service.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Dentist</label>
                                    <select 
                                        name="dentist_id" 
                                        value={appointmentData.dentist_id} 
                                        onChange={handleAppointmentChange} 
                                        className={styles.formField} 
                                        required
                                    >
                                        <option value="">Select a Dentist</option>
                                        {dentists.map(dentist => (
                                            <option key={dentist.id} value={dentist.id}>{dentist.username}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Appointment Date</label>
                                    <input 
                                        type="date" 
                                        name="date" 
                                        value={appointmentData.date} 
                                        onChange={handleAppointmentChange} 
                                        className={styles.formField} 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Appointment Time</label>
                                    {renderSlots()}
                                </div>
                                <div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Branch</label>
                                        <select 
                                            name="branch_id" 
                                            value={appointmentData.branch_id} 
                                            onChange={handleAppointmentChange} 
                                            className={styles.formField} 
                                            required
                                        >
                                            <option value="">Select a Branch</option>
                                            {branches.map(branch => (
                                                <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" className={styles.primaryButton}>Book Appointment</button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className='bg-gray-50'>
            <div className='flex flex-col justify-center items-center'>
                <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
                    <div className="p-6 space-y-4 md:space-y-6">
                        <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                            Add New Patient
                        </h1>
                        <form className="space-y-4 md:space-y-6" onSubmit={handlePatientSubmit}>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Fullname</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={patientData.full_name}
                                    onChange={handlePatientChange}
                                    placeholder=""
                                    className={styles.formField}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Phone</label>
                                <input type="tel" name="phone" value={patientData.phone} onChange={handlePatientChange} className={styles.formField} required />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
                                <input type="email" name="email" value={patientData.email} onChange={handlePatientChange} className={styles.formField} required />
                            </div>
                            <button type="submit" className={styles.primaryButton}>Add Patient</button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default NextAppointment;
