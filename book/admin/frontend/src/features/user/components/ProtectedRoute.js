import { Route, Navigate } from 'react-router-dom';
import React, { lazy, useEffect, useState } from 'react'
import Layout from '../../../containers/Layout'
function ProtectedRoute() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return <Navigate to="/" replace />;
    }
    return <Layout />;
}

export default ProtectedRoute