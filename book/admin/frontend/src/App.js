import React, { lazy, useEffect } from 'react'
import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import { themeChange } from 'theme-change'
import checkAuth from './app/auth';
import initializeApp from './app/init';
import NextAppointment from './pages/protected/NextAppointment';
import { useUser } from './features/user/components/UserContext';
import ReScheduleApp from './pages/protected/ReApp';

const Layout = lazy(() => import('./containers/Layout'))
const Login = lazy(() => import('./pages/Login'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))

initializeApp()

function App() {
  const { isLoggedIn } = useUser();

  useEffect(() => {
    themeChange(false)
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={isLoggedIn ? <Navigate to="/app/dashboard" replace /> : <Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/app/*" element={isLoggedIn ? <Layout /> : <Navigate to="/" replace />} />
        <Route path="/nextappointment" element={isLoggedIn ? <NextAppointment /> : <Navigate to="/" replace />} />
        <Route path="/reschedule" element={isLoggedIn ? <ReScheduleApp /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to={isLoggedIn ? "/app/dashboard" : "/"} replace />} />
      </Routes>
    </Router>
  )
}

export default App;
