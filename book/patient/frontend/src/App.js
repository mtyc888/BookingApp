import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import AppointmentType from './pages/AppointmentType.jsx';
import NewAppointment from './pages/NewAppointment.jsx';
import ExistingAppointment from './pages/ExistingAppointment.jsx';
import RescheduleAppointment from './pages/RescheduleAppointment.jsx';
import RescheduleConfirmation from './pages/RescheduleConfirmation.jsx';
import CancelAppointment from './pages/CancelAppointment.jsx';
import LinkNotFound from './pages/LinkNotFound.jsx';
import StripeDeposit from './pages/StripeDeposit.jsx';
import BookingSuccess2 from './pages/BookingSuccess2.jsx';
import Layout from './layouts/Layout';
import { AppointmentsProvider } from './AppointmentsContext.js';
import AppointmentSelection from './pages/AppointmentSelection.jsx';
import PatientDetails from './pages/PatientDetails.jsx';
import BranchSelection from './pages/BranchSelection.jsx';


function App() {
  return (
    <div className='bg-white font-poppin'>
      <Router forceRefresh={true}>
        <Routes>
          <Route path="/" element={<Layout><BranchSelection /></Layout>} />
          <Route path="/appointment_type" element={<Layout><AppointmentType /></Layout>} />
          <Route path="/new_appointment" element={<Layout><NewAppointment /></Layout>}></Route> 
          <Route path="/existing_appointment" element={<Layout><ExistingAppointment /></Layout>}></Route> 
          <Route path="/rescheduling_appointment" element={<Layout><RescheduleAppointment /></Layout>}></Route>   
          <Route path="/reschedule_confirmation" element={<Layout><RescheduleConfirmation /></Layout>}></Route>   
          <Route path="/cancel_appointment" element={<Layout><CancelAppointment /></Layout>}></Route>  
          <Route path="/expired_link" element={<LinkNotFound />} />
          <Route path="/appointment_selection" element={<Layout><AppointmentSelection /></Layout>}></Route>  
          <Route path="/patient_details" element={<PatientDetails />}></Route>  
          <Route path="/stripe" element={<StripeDeposit/>}></Route>  
          <Route path="/booking-success" element={<BookingSuccess2/>}></Route>          
          <Route path="*" element={<div>404 - Not Found</div>} />
        </Routes>
        {/* Add more Route components for other routes */}
      </Router>
    </div>
  );
}

function AppWithUserProvider() {
  return (
    <AppointmentsProvider>
      <App />
    </AppointmentsProvider>
  );
}

export default AppWithUserProvider;
