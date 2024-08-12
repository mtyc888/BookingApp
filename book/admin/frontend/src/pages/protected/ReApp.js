import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ReScheduleApp() {
  const [bookingReference, setBookingReference] = useState('');
  const [appointment, setAppointment] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedDate && appointment) {
      // Fetch new slots for the selected date when date changes
      fetchSlots(appointment.service_id, selectedDate, appointment.dentist_id);
    }
  }, [selectedDate, appointment]);

  const fetchAppointment = async (bookingRef) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/appointments/${bookingRef}`);
      setAppointment(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch appointment. Please try again.');
      setLoading(false);
    }
  };

  const fetchSlots = async (serviceId, date, dentistId) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/appointment-slots/', {
        params: { date, service_id: serviceId, dentist_id: dentistId },
      });
      console.log(response.data.slots)
      setAvailableSlots(response.data.slots);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch available slots.');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setBookingReference(e.target.value);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedTime('');
  };

  const handleTimeChange = (e) => {
    const time = e.target.value;
    setSelectedTime(time);
  
    // Find the slot that matches the selected time
    const selectedSlot = availableSlots.find(slot => slot.start_time === time);
  
    // If a matching slot is found, print its ID or IDs
    if (selectedSlot) {
      console.log("Selected slot IDs:", selectedSlot.id);
    } else {
      console.log("No matching slot found for the selected time.");
    }
  };

  
  const handleFormSubmit = (e) => {
    e.preventDefault();
    fetchAppointment(bookingReference);
  };
  const getNewSlotsTaken = () => {
    // Assuming that each slot is 15 minutes and the appointment duration is in the format "HH:MM:SS"
    const durationParts = appointment.appointment_duration.split(":");
    const hours = parseInt(durationParts[0], 10);
    const minutes = parseInt(durationParts[1], 10);
    const totalDurationInMinutes = hours * 60 + minutes;
  
    // Calculate the number of slots needed based on a 15-minute slot duration
    const slotsNeeded = Math.ceil(totalDurationInMinutes / 15);
  
    // Find the index of the selected slot based on the start time
    const selectedSlotIndex = availableSlots.findIndex(slot => slot.start_time === selectedTime);
    if (selectedSlotIndex === -1 || selectedSlotIndex + slotsNeeded > availableSlots.length) {
      // Handle the case where the selected time is not found, or there aren't enough consecutive slots
      console.error("Not enough consecutive slots available.");
      return [];
    }
  
    // Slice the array from the selected index to get the required number of consecutive slots
    const newSlotsTaken = availableSlots.slice(selectedSlotIndex, selectedSlotIndex + slotsNeeded).map(slot => slot.id);
  
    return newSlotsTaken.flat(); // Ensure it's a single-level array of IDs
  };
  
  const handleReschedule = async (e) => {
    e.preventDefault();
    const newDateTime = `${selectedDate}T${selectedTime}:00.000Z`;

    try {
        // Get the old slots that need to be updated (the ones currently booked)
        const oldSlots = appointment.slots_taken; // Assuming `slots_taken` is an array of IDs from the current appointment

        // Get the new slots that need to be booked
        const newSlotsTaken = getNewSlotsTaken();

        const response = await axios.post('http://127.0.0.1:8000/api/appointments-reschedule/', {
            booking_reference: bookingReference,
            new_date_time: newDateTime,
            old_slots_taken: oldSlots, // Old slots that need to be freed up
            new_slots_taken: newSlotsTaken // New slots that need to be booked
        });

        // Check the response
        if (response.status === 200) {
            alert("Appointment rescheduled successfully!");
            // Additional logic for success
        } else {
            setError("Failed to reschedule appointment.");
        }
    } catch (error) {
        console.error('Error rescheduling appointment:', error);
        setError('Failed to reschedule appointment. Please try again.');
    }
};

  

  const renderSlots = () => {
    if (loading) return "Loading slots...";
    if (!availableSlots.length) return "No slots available for this date.";

    return (
      <select
        name="time"
        value={selectedTime}
        onChange={handleTimeChange}
        className="px-4 py-2 border rounded-lg w-full"
        required
      >
        <option value="">Select a time slot</option>
        {availableSlots.map((slot, index) => (
          <option key={index} value={slot.start_time}>
            {`${slot.start_time} - ${slot.end_time}`}
          </option>
        ))}
      </select>
    );
  };
  

  return (
    <div className="container mx-auto mt-10 p-5">
      <h1 className="text-2xl font-bold mb-6">Reschedule Appointment</h1>
      <form onSubmit={handleFormSubmit} className="mb-6">
        <label htmlFor="bookingReference" className="block text-lg font-medium mb-2">Booking Reference:</label>
        <input
          type="text"
          id="bookingReference"
          value={bookingReference}
          onChange={handleInputChange}
          placeholder="Enter booking reference"
          required
          className="px-4 py-2 border rounded-lg mb-4 w-full"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
        >
          {loading ? 'Loading...' : 'Submit'}
        </button>
      </form>
      {error && <p className="text-red-500">{error}</p>}

      {/* Form for rescheduling the appointment */}
      {appointment && (
        <form onSubmit={handleReschedule} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-xl font-bold mb-4">Edit Appointment</h2>
          <div className="mb-4">
            <label htmlFor="appointmentDate" className="block text-lg font-medium mb-2">Date:</label>
            <input
              type="date"
              id="appointmentDate"
              value={selectedDate}
              onChange={handleDateChange}
              className="px-4 py-2 border rounded-lg w-full"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="appointmentTime" className="block text-lg font-medium mb-2">Time:</label>
            {renderSlots()}
          </div>
          {/* Add additional fields as needed */}
          <button
            type="submit"
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            Reschedule Appointment
          </button>
        </form>
      )}
    </div>
  );
}

export default ReScheduleApp;
