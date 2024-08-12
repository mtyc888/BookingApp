import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/sparks.png';
import {JwtTokenManager, UserManager } from '../storage';
import Cookie from 'react-cookies';
import { useUser } from '../layouts/UserContext.js';
import { BASE_URL } from '../App.js';

function Login() {
    const navigate = useNavigate(); 
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const { setIsLoggedIn } = useUser();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };
    const handleSubmit = (e) =>{
        e.preventDefault();
  
        axios.post(`${BASE_URL}login`,
        {
            "email":formData.email,
            "password": formData.password
        })
        .then(response => {
            console.log(response.data);
            if(response.data.error){
                alert(response.data.error.message + ": " + response.data.error.details);
                console.error(response.data.error.details);
            } else {
                console.log("tsetung" + response.data.dentist[0]);
                const userManager = new UserManager();
                userManager.saveUser(response.data.dentist[0]);
    
                // Retrieve the token
                const user = userManager.getUser();
                console.log('User:', user);

                Cookie.save('isLoggedIn', true, { path: '/' });
                setIsLoggedIn(true);
                
                // navigate('/');
            }
            
        })
        .catch(error => {
            alert("Error!");
            console.error('Error:', error);
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
                      Sign in to your account
                  </h1>
                  <form class="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
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
                      <div class="flex items-center justify-between">
                          
                          <a href="#" class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">Forgot password?</a>
                      </div>
                      <button type="submit" class="w-full text-white bg-primary-400 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Sign in</button>
                      
                      <div
                        class="my-4 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-neutral-300 after:mt-0.5 after:flex-1 after:border-t after:border-neutral-300">
                        <p
                            class="mx-4 mb-0 text-center text-gray-500 font-semibold dark:text-white">
                            Or
                        </p>
                        </div>
 
                      
                      <p class="text-sm font-light text-gray-500 dark:text-gray-400">
                          Don’t have an account yet? <a href='/signup' class="font-medium text-primary-600 hover:underline dark:text-primary-500">Sign up</a>
                      </p>
                  </form>
              </div>
          </div>
      </div>
    </section>
    );
}

export default Login;
