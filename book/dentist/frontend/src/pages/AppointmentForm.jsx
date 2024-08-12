import  {useState, useEffect} from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import {Appointment, Patient} from "../models";
import {JwtTokenManager, UserManager, LSAppointment } from '../storage';
import styles from "../styles";
import currency from "../assets/currency.svg";
import {FaArrowLeft} from "react-icons/fa6";
import Rodal from 'rodal';
// include styles
import 'rodal/lib/rodal.css';
import { BASE_URL } from '../App';
import {Loading} from "../components/Loading.jsx";

function FollowUpAppointment() {
  const navigate = useNavigate(); 
  let { id } = useParams();
  const [appointment, setAppointment] = useState(new Appointment());
  const [patient, setPatient] = useState(new Patient());
  const [formData, setFormData] = useState({
    medical_conds: '',
    medication: '',
    allergies: '',
    oral_hygiene: '',
    gum_health: '',
    dental_caries: '',
    treatment_recommendations: '',
    estimated_costs: 0.00,
  });
  const [visible, isVisible] = useState(false);

  const [loading, isLoading] = useState(false);
  
  useEffect(() => {

    const jwtManager = new JwtTokenManager();
    const token = jwtManager.getToken();
    
    isLoading(true);

    axios.post(`${BASE_URL}get_appointment_form_by_id`,
    {
      "id" : id
    })
    .then(response => {
      const returned = new Appointment().parseData(response.data["appointment"]);
      setAppointment(returned);
      //previously saved results
      const returned2 = response.data["form"];
      console.log("response.data[form]" + response.data["form"]);
      if(Object.keys(returned2).length > 0){
        formData.medical_conds = returned2.medical_conds;
        formData.medication = returned2.medication;
        formData.allergies = returned2.allergies;
        formData.oral_hygiene = returned2.oral_hygiene;
        formData.gum_health = returned2.gum_health;
        formData.dental_caries = returned2.dental_caries;
        formData.treatment_recommendations = returned2.treatment_recommendations;     
        formData.estimated_costs = returned2.estimated_costs;      
      }

      if(returned.patient_id > 0){
        axios.post(`${BASE_URL}get_patient_by_id`,
        {
          'id': returned.patient_id,
        })
        .then(response => {
          const returned = new Patient().parseData(response.data["patient"]);
          setPatient(returned)

          console.log("response.data" + JSON.stringify(returned));
        })
        .catch(error => {
            console.error('Error:', error);
        })
        .finally(() => {
          //isLoading(false); 
        });
      }
      else{
        alert('Failed to retrieve patient\'s data');
      }
    })
    .catch(error => {
        console.error('Error:', error);
    })
    .finally(() => {
      isLoading(false); 
    });

  },[]);

  const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
  };
  const handleSubmit = (e) =>{
      e.preventDefault();

      

      axios.post(`${BASE_URL}submit_appointment_form`,
      {
        "appointment_id" : id,
        "medical_conds": formData.medical_conds,
        "medication": formData.medication,
        "allergies": formData.allergies,
        "oral_hygiene": formData.oral_hygiene,
        "gum_health": formData.gum_health,
        "dental_caries": formData.dental_caries,
        "treatment_recommendations": formData.treatment_recommendations,
        "estimated_costs": formData.estimated_costs,

       
      })
      .then(response => {
        if(response.data.error){
          alert("Failed to set appointment");
        } else {
          alert("Successful:" + JSON.stringify(response));

          LSAppointment.setAppointment(appointment);

          console.log("LSAppointment.getAppointment()", LSAppointment.getAppointment());

          //show popup
          isVisible(true);
        }
      })
      .catch(error => {
          alert("Error!");
          console.error('Error:', error.message);
      });
  
  }

  function handleCancel(e){
    axios.post(`${BASE_URL}delete_appointment`,
      {
        "appointment_id" : id,
      })
      .then(response => {
        if(response.data.error){
          alert("Failed to delete appointment");
        } else {
          alert("Successful:" + JSON.stringify(response.data.message));

          navigate("/");
        }
      })
      .catch(error => {
          alert("Error!");
          console.error('Error:', error.message);
      });
  }

  return (
    <>
    {loading 
    ? 
    (
      <Loading />
    )
    : 
      <section >
      {/* //https://github.com/chenjiahan/rodal */}
      <Rodal visible={visible} onClose={() => {isVisible(false); }}>
        <div className='p-5 w-full h-full flex flex-col text-center'>
          <div className='grow'>
          <h3 className='text-lg py-4'>Set up next appointment now or later?</h3>
          </div>

          <div className='shrink flex flex-col md:flex-row gap-6'>
          <button type="button" onClick={() => {navigate("/");}} className={styles.disabledButton}>Cancel</button>
          <button type="button" onClick={() => {navigate("/appointments/next", { state: { appointment: appointment } });}} className={styles.primaryButton}>Proceed</button>
          </div>
        </div>
        
      </Rodal>

      <div className='mb-8 md:ml-8 flex flex-row md:flex-col justify-center md:justify-start'>
        <p className='text-gray-500 hover:underline hover:cursor-pointer' onClick={
          () => {
            window.history.back();
            //navigate("/appointments/next", { state: { appointment: appointment } })
          }
        }><FaArrowLeft className='inline-block text-gray-500 hover:underline'/> Back</p>
        <h1 class="text-2xl font-bold leading-tight tracking-tight text-gray-900 md:text-4xl dark:text-white">
            Appointment # {id}
        </h1>
      </div>
      <div className='w-full flex flex-col md:flex-row justify-start gap-8 md:gap-12'>
        
      <div className='basis-1/3 md:order-last'>
          <div className='sticky top-20'>
          <div className="w-full bg-white rounded-lg shadow dark:border sm:max-w-md mb-6">
          <div className='p-6 space-y-4 md:space-y-6 sm:p-8'>
          
              <div className='flex flex-col space-y-3'>
              <h3 class="text-md md:text-lg font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
                  Patient Information
              </h3>  

              <p>ID: <span className='font-bold text-sm'>{patient.id}</span></p>
              <p>Name: <span className='font-bold text-sm'>{patient.first_name} {patient.last_name}</span></p>
              <p>Phone: <span className='font-bold text-sm'>{patient.phone}</span></p>
              <p>Email: <span className='font-bold text-sm'>{patient.email}</span></p>
              <p>Address: <span className='font-bold text-sm'>{patient.address}</span></p>
              {/* { Object.entries(patient).map((t,k) => <p key={k}>Patient <span>{t[0]}</span>: <span className='font-bold text-sm'>{t[1]}</span></p>) }  */}                 
              </div>
          </div>
          </div>

          <button type='button' onClick={handleCancel} className={styles.dangerButton}>Delete Appointment</button>
          </div>

          
        </div>
        <div className='basis-2/3'>
        <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
            
            <form class="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
            
                {/* <div>
                    <h3 class="text-md md:text-lg font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
                        Date of Consultation
                    </h3>  
                    <input type="datetime-local" name="datetime" className={`${styles.formField} resize-none`} />
                </div> */}

                <div className='flex flex-col space-y-2 md:space-y-2'>
                    <h3 class="text-md md:text-lg font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
                      Medical History
                    </h3>  

                    <div>
                      
                      <p className='inline-block'>Medical Conditions:</p>
                      <textarea
                      name='medical_conds'
                      placeholder='Any Medical Conditions'
                      value={formData.medical_conds}
                      onChange={handleChange}
                      className={`${styles.formField} resize-none`}
                      >
                      </textarea>
                    </div>
                    <div>
                      
                      <p className='inline-block'>Medications:</p>
                      <textarea
                      name='medication'
                      onChange={handleChange}
                      placeholder='Any Medications'
                      value={formData.medication}
                      className={`${styles.formField} resize-none`}>

                      </textarea>
                    </div>
                    <div>
                      
                      <p className='inline-block'>Allergies:</p>
                      <textarea
                      name='allergies'
                      onChange={handleChange}
                      placeholder='Any Allergies'
                      value={formData.allergies}
                      className={`${styles.formField} resize-none`}>

                      </textarea>
                    </div>
                </div>

                <div className='flex flex-col space-y-2 md:space-y-2'>
                    <h3 class="text-md md:text-lg font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
                    Examination Findings
                    </h3>  

                    <div>
                      
                      <p className='inline-block'>Oral Hygiene:</p>
                      <textarea
                      name='oral_hygiene'
                      placeholder='good, fair, poor'
                      value={formData.oral_hygiene}
                      onChange={handleChange}
                      className={`${styles.formField} resize-none`}>
                      
                      </textarea>
                    </div>
                    <div>
                      
                      <p className='inline-block'>Gum Health (Periodontal Status):</p>
                      <textarea
                      name='gum_health'
                      onChange={handleChange}
                      placeholder='healthy, gingivitis, periodontitis'
                      value={formData.gum_health}
                      className={`${styles.formField} resize-none`}>

                      </textarea>
                    </div>
                    <div>
                      
                      <p className='inline-block'>Dental Caries (Cavities):</p>
                      <textarea
                      name='dental_caries'
                      onChange={handleChange}
                      placeholder='dental caries and their location'
                      value={formData.dental_caries}
                      className={`${styles.formField} resize-none`}>

                      </textarea>
                    </div>
                    
                </div>

                <div className='flex flex-col space-y-2 md:space-y-2'>
                    <h3 class="text-md md:text-lg font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
                    Treatment Plan
                    </h3>  

                    <div>
                      
                      <p className='inline-block'>Treatment Recommendations:</p>
                      <textarea
                      name='treatment_recommendations'
                      placeholder='List recommended dental treatments or procedures'
                      value={formData.treatment_recommendations}
                      onChange={handleChange}
                      className={`${styles.formField} resize-none`}>
                      
                      </textarea>
                    </div>
                    <div>
                      
                      <p className='inline-block'>Estimated Costs:</p>
                      <div class="flex">
  <span class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
    <img src={currency} alt="currency" className="w-4 h-4 text-gray-500"/>
  </span>
  <input type="number" name="estimated_costs" value={formData.estimated_costs} onChange={handleChange} className={`${styles.formField} rounded-none rounded-r-lg border-l-0`} placeholder="0.00" />
  </div>
                    </div>
                    
                </div>
                
                <div>
                    

                </div>

                <button type="submit" className={styles.primaryButton}>Submit</button>
            </form>
          </div>
        </div>
        </div>
        
      </div>
    </section>}
    </>
  )
}

export default FollowUpAppointment