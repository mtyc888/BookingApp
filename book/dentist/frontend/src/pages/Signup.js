import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/sparks.png';
import apple from '../assets/apple-icon.svg';
import { BASE_URL } from '../App';

function Signup() {
    const [users, setUsers] = useState([]);
    const navigate = useNavigate(); 
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };
    const handleSubmit = (e) =>{
        e.preventDefault();
  
        axios.post(`${BASE_URL}register`,
        {
            "first_name": formData.firstname,
            "last_name": formData.lastname,
            "username": formData.username,
            "email":formData.email,
            "password": formData.password
        })
        .then(response => {
            if(response.data.error){
                alert(response.data.error.message + ": " + response.data.error.details);
                console.error(response.data.error.details);
            } else {
                console.log("response.data.dentist", response.data.dentist);
                let dentist = response.data.dentist;
                alert("Successfully login: " + dentist.id);

                navigate("/login");
            }
            
        })
        .catch(error => {
            alert("Error!");
            console.error('Error:', error.message);
        });
    
    }

    return (
      <section class="bg-gray-50 dark:bg-gray-900">
      <div class="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
          <a href="#" class="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
              <img class="w-8 h-8 mr-2" src={logo} alt="logo"/>
              BookingApp    
          </a>
          <div class="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
              <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
                  <h1 class="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                      Create New account
                  </h1>
                  <form class="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                      <div class="flex flex-row space-x-4">
                        <div>
                            <label for="firstname" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Firstname</label>
                            <input 
                            type="text"
                            name="firstname"
                            placeholder='First name'
                            value={formData.firstname}
                            onChange={handleChange} 
                            class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required />
                        </div>
                        <div>
                            <label for="lastname" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Lastname</label>
                            <input 
                            type="text"
                            name="lastname"
                            placeholder='Last Name'
                            value={formData.lastname}
                            onChange={handleChange} 
                            class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required />
                        </div>
                      </div>
                      <div>
                          <label for="username" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Username</label>
                          <input 
                          type="text"
                          name="username"
                          placeholder='Your Username'
                          value={formData.username}
                          onChange={handleChange} 
                          class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required />
                      </div>
                      <div>
                          <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
                          <input 
                          type="email"
                          id="email"
                          name="email"
                          placeholder='Your Email'
                          value={formData.email}
                          onChange={handleChange} 
                          class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required />
                      </div>
                      <div>
                          <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                          <input 
                          type="password"
                          id="password"
                          name="password"
                          placeholder='Your Password'
                          value={formData.password}
                          onChange={handleChange}
                          class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required />
                      </div>
                      <button type="submit" class="w-full text-white bg-primary-400 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Sign up</button>                   

                    <div
                    class="my-4 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-neutral-300 after:mt-0.5 after:flex-1 after:border-t after:border-neutral-300">
                    <p
                        class="mx-4 mb-0 text-center text-gray-500 font-semibold dark:text-white">
                        Or
                    </p>
                    </div>

                    <div
                    class="flex flex-row space-x-3 items-center justify-center">
                    <button
                        type="button"
                        class="mx-1 h-9 w-9 rounded-full border-slate-200 shadow-lg hover:shadow hover:border-slate-400 flex items-center justify-center transition duration-150 ease-in-out">
                        <img class="w-6 h-6" src="https://www.svgrepo.com/show/475656/google-color.svg" loading="lazy" alt="google logo"/>
                    </button>

                    <button
                        type="button"
                        class="mx-1 h-9 w-9 rounded-full border-slate-200 shadow-lg hover:shadow hover:border-slate-400 flex items-center justify-center transition duration-150 ease-in-out">
                        <img class="w-6 h-6" src={apple} loading="lazy" alt="google logo"/>
                    </button>
                    </div>
                      <p class="text-sm font-light text-gray-500 dark:text-gray-400">
                          Already have an account? <a href='/login' class="font-medium text-primary-600 hover:underline dark:text-primary-500">Login Now</a>
                      </p>
                  </form>
              </div>
          </div>
      </div>
    </section>
    );
}

export default Signup;
