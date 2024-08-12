import React, { useState } from "react";
import { FaAlignJustify } from "react-icons/fa6";
import sparks from '../assets/sparks.png';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {JwtTokenManager, UserManager } from '../storage';
import Cookie from 'react-cookies';

function Navbar({toggle, handleToggle, active}){
  const navigate = useNavigate();

  const handleLogOut = () => {
    const jwtManager = new JwtTokenManager();
    jwtManager.clearToken();

    const userManager = new UserManager();
    userManager.clearUser();

    Cookie.remove('isLoggedIn', { path: '/' });
    window.location.href = '/';
  }
  return (
    <>
    <nav className="sticky top-0 bg-primary-900 border-gray-300 z-40">
        <div className="flex justify-between items-center px-9">
            
            <div className="flex flex-row"
            onClick={() => {
              navigate("/");
            }}
            >
                <img src={sparks} alt="logo" className="h-fit mr-1"/>
            </div>
            
            <div className="space-x-4">
              <button onClick={handleLogOut} type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Log Out</button>
            </div>
        </div>
    </nav>
    </>
  );
}

export default Navbar;