import { useEffect, useState, createContext, useContext, useMemo } from 'react';
import AppointmentStorage from './storage.js';

const AppointmentsContext = createContext(null);

export function AppointmentsProvider({ children }) {
  const [choice, setChoice] = useState(AppointmentStorage.getChoice() || {});
  const [branch, setBranch] = useState(AppointmentStorage.getBranch() || {});
  const [dentist, setDentist] = useState(AppointmentStorage.getDentist() || {});
  const [service, setService] = useState(AppointmentStorage.getService() || {});
  const [appointment_date, setAppointmentDate] = useState(AppointmentStorage.getAppointmentDate() || "");
  const [appointment_time, setAppointmentTime] = useState(AppointmentStorage.getAppointmentTime() || "");

  const contextValue = useMemo (() => ({
    choice,
    setChoice,
    branch,
    setBranch,
    dentist, 
    setDentist,
    service,
    setService,
    appointment_date,
    setAppointmentDate,
    appointment_time,
    setAppointmentTime
  }), [choice, setChoice,branch, setBranch, service, setService, appointment_date, setAppointmentDate, appointment_time, setAppointmentTime]);

  return (
    <AppointmentsContext.Provider value={contextValue}>
      {children}
    </AppointmentsContext.Provider>
  );
}

export function useAppointments() {
  return useContext(AppointmentsContext);
}
