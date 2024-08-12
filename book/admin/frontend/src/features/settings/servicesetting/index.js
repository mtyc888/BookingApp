import moment from "moment";
import { useState, useEffect } from "react";
import TitleCard from "../../../components/Cards/TitleCard";
import { useDispatch } from "react-redux";
import { showNotification } from '../../common/headerSlice';
import InputText from '../../../components/Input/InputText';
import axios from 'axios'
function CreateService() {
    const dispatch = useDispatch();
    const [services, setServices] = useState([]);
    const [serviceName, setServiceName] = useState('');
    const [serviceDuration, setServiceDuration] = useState('00:00:00');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const handleSubmit = async () => {
        const payload = {
            name: serviceName,
            duration: serviceDuration,
            status: 1, // Assuming 1 means active or some default value.
            created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
            updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
        };
        try {
            const response = await axios.post('http://127.0.0.1:8000/add_service/', payload);
            if (response.data) {
                dispatch(showNotification({message: "Service Created Successfully", status: 1}));
                // Refreshing the services list
                fetchServices();
            }
        } catch (error) {
            console.error("Error adding service:", error);
            alert("Failed to add the service. Please try again later.");
        }
        // Here, make a POST request to save the new service.
        // For example:
        // const response = await fetch('yourAPI/saveService', { method: 'POST', body: JSON.stringify(payload) });
        // if (response.ok) dispatch(showNotification({message : "Service Created Successfully", status : 1}));

        dispatch(showNotification({message : "Service Created Successfully", status : 1}));
    };
    useEffect(() => {
        fetchServices();
    }, []);
    const fetchServices = () => {
        axios.get('http://127.0.0.1:8000/get_services/')
        .then(response => {
            const activeServices = response.data.services.filter(service => service.status === 1);
            setServices(activeServices);
            setLoading(false);
        })
        .catch(err => {
            console.error("Error fetching services:", err);
            setError("Failed to fetch services. Please try again later.");
            setLoading(false);
        });
    };
    //implement this url
    const handleDelete = (serviceID) => {
        if (window.confirm("Are you sure to deactivate this service?")) {
            axios.post(`http://127.0.0.1:8000/deactivate_service/${serviceID}/`)
            .then(() => {
                // After successful deactivation, update the services state.
                setServices(prevServices => prevServices.filter(service => service.id !== serviceID));
            })
            .catch(err => {
                console.error("Error deactivating service:", err);
                alert("Failed to deactivate the service. Please try again later.");
            });
        }
    }
    console.log(services)
    return (
        <>
            <TitleCard title="All Services" topMargin="mt-2" TopSideButtons={<></>}>
                {/* Admin list in table format */}
                <div className="overflow-x-auto w-full">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Duration</th>
                                <th>Action</th> {/* For the delete button */}
                            </tr>
                        </thead>
                        <tbody>
                            {
                                services.map((service) => {
                                    return(
                                        <tr key={service.id}>
                                            <td>{service.id}</td>
                                            <td>{service.name}</td>
                                            <td>{service.duration}</td>
                                            <td>
                                                <button onClick={() => handleDelete(service.id)} className="border h-8 w-20 rounded-xl bg-red-600 text-white font-bold">Delete</button>
                                            </td>
                                        </tr>
                                    );
                                })
                            }
                        </tbody>
                    </table>
                </div>
            </TitleCard>
            <TitleCard title="Create New Service" topMargin="mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputText 
                        labelTitle="Service Name" 
                        defaultValue="" 
                        updateFormValue={(data) => setServiceName(data.value)} 
                    />
                    <InputText 
                        labelTitle="Service Duration (Format: HH:MM:SS)" 
                        defaultValue="00:00:00" 
                        updateFormValue={(data) => setServiceDuration(data.value)} 
                    />
                </div>

                <div className="mt-16">
                    <button className="btn btn-primary float-right" onClick={handleSubmit}>Create Service</button>
                </div>
            </TitleCard>
        </>
    );
}

export default CreateService;
