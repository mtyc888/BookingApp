import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import TitleCard from "../../../components/Cards/TitleCard";
import { showNotification } from '../../common/headerSlice';
import axios from 'axios';

function Team(){
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = () => {
        axios.get('http://127.0.0.1:8000/get_admins/')
        .then(response => {
            setAdmins(response.data.admins);
            setLoading(false);
        })
        .catch(err => {
            console.error("Error fetching admins:", err);
            setError("Failed to fetch admins. Please try again later.");
            setLoading(false);
        });
    };

    const handleDelete = (adminId) => {
        if(window.confirm("Are you sure to remove this account?")) {
            axios.delete(`http://127.0.0.1:8000/delete_admin/${adminId}/`) // Ensure you have an endpoint to handle delete requests.
            .then(() => {
                // After successful deletion, update the admins state.
                setAdmins(prevAdmins => prevAdmins.filter(admin => admin.id !== adminId));
            })
            .catch(err => {
                console.error("Error deleting admin:", err);
                alert("Failed to delete the admin. Please try again later.");
            });
        }
    }

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <>
            <TitleCard title="All Accounts" topMargin="mt-2" TopSideButtons={<></>}>

                {/* Admin list in table format */}
                <div className="overflow-x-auto w-full">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Super User</th>
                                <th>Action</th> {/* For the delete button */}
                            </tr>
                        </thead>
                        <tbody>
                            {
                                admins.map((admin) => {
                                    return(
                                        <tr key={admin.id}>
                                            <td>{admin.id}</td>
                                            <td>{admin.username}</td>
                                            <td>{admin.is_superuser === 1 ? "Yes" : "No"}</td>
                                            <td>
                                                <button onClick={() => handleDelete(admin.id)} className="border h-8 w-20 rounded-xl bg-red-600 text-white font-bold">Delete</button>
                                            </td>
                                        </tr>
                                    );
                                })
                            }
                        </tbody>
                    </table>
                </div>
            </TitleCard>
        </>
    );
}

export default Team;
