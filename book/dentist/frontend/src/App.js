import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Signup from './pages/Signup';
import TimeTable from './pages/TimeTable';
import AppointmentForm from './pages/AppointmentForm';
import NextAppointment from './pages/NextAppointment';

import Layout from './layouts/Layout';

import { UserProvider, useUser } from './layouts/UserContext.js';

export const BASE_URL = "http://127.0.0.1:8000/";

function App() {
  const { isLoggedIn } = useUser();

  return (
    <div className='bg-white font-poppin'>
      {/* <Router forceRefresh={true}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Layout><TimeTable /></Layout>} />
          <Route path="/appointments/next" element={<Layout><NextAppointment /></Layout>} />
          <Route path="/appointments/:id" element={<Layout><AppointmentForm /></Layout>} />
          <Route path="*" element={<div>404 - Not Found</div>} />
        </Routes>
      </Router> */}

    <Router forceRefresh={true}>
      <Routes>
        <Route path="/" element={isLoggedIn ? <Layout><TimeTable /></Layout> : <Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/appointments/next" element={isLoggedIn ? <Layout><NextAppointment /></Layout> : <Login />} />
        <Route path="/appointments/:id" element={isLoggedIn ? <Layout><AppointmentForm /></Layout> : <Login />} />
        <Route path="*" element={isLoggedIn ? <Layout><TimeTable /></Layout> : <Login />} />
      </Routes>
    </Router>
    </div>
  );
}

function AppWithUserProvider() {
  return (
    <UserProvider>
      <App />
    </UserProvider>
  );
}

export default AppWithUserProvider;
