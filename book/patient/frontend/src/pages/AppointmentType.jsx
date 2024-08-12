import { useNavigate } from 'react-router-dom';
import sparks from '../assets/sparks.png';
import AppointmentStorage from "../storage.js";

function AppointmentType() {
  const choices = [
    {
      "id" : 1,
      "name" : "New Patient  - Exam and Cleaning",
      "to" : "/new_appointment"
    },
    // {
    //   "id" : 2,
    //   "name" : "Existing Patient  - Exam and Cleaning",
    //   "to" : "/existing_appointment"
    // },
    {
      "id" : 3,
      "name" : "Rescheduling Booked Appointment",
      "to" : "/rescheduling_appointment"
    },
    {
      "id" : 4,
      "name" : "Cancel Appointment",
      "to" : "/cancel_appointment"
    }
  ];
  const navigate = useNavigate();


  return (
    <div className="flex flex-col w-full h-full justify-content-center align-items-center py-16 px-12">
      <img src={sparks} className="w-[8rem] mb-8"/>
      <h3 className="text-3xl font-bold mb-5">What type of appointment would you like to schedule?</h3>

      {
        choices && choices.map((choice) => 
          <div className="bg-zinc-200 text-white hover:bg-zinc-300 w-full cursor-pointer rounded p-3.5 text-left focus:outline-none mb-3" 
          id={`choice_${choice.id}`} 
          role="radio" 
          aria-checked="false" 
          tabindex="0" 
          aria-labelledby=""
          onClick={() => {
            //set choice id to context first
            AppointmentStorage.setChoice(choice);
            navigate(choice.to);
          }}
          >
            <span className="flex items-center justify-between">
              <span className="text-neutral-900 ml-3 w-full font-medium">
                <div className="flex w-full flex-row justify-between">
                  {choice.name}
                </div>
              </span>
            </span>
          </div>
        )
      }
    </div>
  )
}

export default AppointmentType;

//select time & date and preferred dentist as well as clinic location (branch)