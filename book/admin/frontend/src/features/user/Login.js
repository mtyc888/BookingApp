import { useState } from 'react'
import { Link } from 'react-router-dom'
import LandingIntro from './LandingIntro'
import ErrorText from  '../../components/Typography/ErrorText'
import InputText from '../../components/Input/InputText'
import { useNavigate } from 'react-router-dom';
import axios from 'axios'
import Cookie from 'react-cookies';
import { useUser } from '../user/components/UserContext';

function Login(){
    const { setIsLoggedIn } = useUser();
    const INITIAL_LOGIN_OBJ = {
        password : "",
        emailId : ""
    }
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [loginObj, setLoginObj] = useState(INITIAL_LOGIN_OBJ)
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        const { emailId, password } = loginObj; 
        
        let validUser = null;
        
        try {
            const response = await axios.get('http://127.0.0.1:8000/get_admins/');  
            const admins = response.data.admins;
            validUser = admins.find(admin => admin.username === emailId && admin.password === password);
        } catch (error) {
            console.error('Error fetching admins', error);
            setErrorMessage('Error logging in. Please try again.');
        }

        if (validUser) {
            Cookie.save('isLoggedIn', true, { path: '/' });
            setIsLoggedIn(true);
            navigate('/app/dashboard');
        } else {
            setErrorMessage('Invalid Credentials');
        }
    };

    const updateFormValue = ({updateType, value}) => {
        setErrorMessage("");
        setLoginObj({...loginObj, [updateType] : value});
    }

    return(
        <div className="min-h-screen bg-base-200 flex items-center">
            <div className="mx-auto w-full max-w-xl  shadow-xl">
                <div className=" bg-base-100 rounded-xl">
                    <div className='py-24 px-10'>
                        <h2 className='text-2xl font-semibold mb-2 text-center'>Login</h2>
                        <form onSubmit={(e) => handleLogin(e)}>
                            <div className="mb-4">
                                <InputText type="emailId" defaultValue={loginObj.emailId} updateType="emailId" containerStyle="mt-4" labelTitle="Email Id" updateFormValue={updateFormValue}/>
                                <InputText defaultValue={loginObj.password} type="password" updateType="password" containerStyle="mt-4" labelTitle="Password" updateFormValue={updateFormValue}/>
                            </div>
                            <div className='text-right text-primary'><Link to="/forgot-password"><span className="text-sm  inline-block  hover:text-primary hover:underline hover:cursor-pointer transition duration-200">Forgot Password?</span></Link>
                            </div>
                            <ErrorText styleClass="mt-8">{errorMessage}</ErrorText>
                            <button type="submit" className={"btn mt-2 w-full btn-primary" + (loading ? " loading" : "")}>Login</button>
                            <div className='text-center mt-4'>Don't have an account yet? <Link to="/register"><span className="  inline-block  hover:text-primary hover:underline hover:cursor-pointer transition duration-200">Register</span></Link></div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
