This is a simple booking application that is built using the following stack:

Frontend:
Reactjs
TailwindCSS

Backend: 
Django Framework

Database:
MySQL

Admin:
1) View all appointments in a selected time period
2) Create new appointments
3) Reschedule appointments
4) Remove/add dentists
5) Remove/add services

Dentists
1) view appointments under them

Patient
1) book appointments

cd to the respective frontend/backend directory for each actors (admin/patient/dentist)

frontend -> npm install -> npm start
backend -> python manage.py migrate -> python manage.py runserver

Since this project has not been hosted, you will need to create and connect your own MySQL database. Creating the tables that is reflected to the models.py file for each folder (actors)

Example:

(models.py) ![image](https://github.com/user-attachments/assets/0a31d7e3-e24e-4d78-8e7f-90059bbb14e5)
(MySQL Workbench) ![image](https://github.com/user-attachments/assets/dbc99009-85f0-4def-90cb-0cdd65075050)

Bugs and Design errors:
1) For patient booking, once patient books it does not change the appointment_slot's "is_available" from 1 to 0, resulting in dentist not being able to view the appointments on their end.

Things to work on:
1) Syncronization for appointment bookings
2) chatbot to handle booking inquiries




