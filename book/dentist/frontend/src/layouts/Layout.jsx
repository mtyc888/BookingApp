import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles';
import {JwtTokenManager, UserManager } from '../storage';

function Layout({children}){
    const [toggle, setToggle] = useState(false);
    const [active, setActive] = useState("");

    //check before launching the components
    const navigate = useNavigate(); 
    useEffect(() => {
        const userManager = new UserManager();
        const user = userManager.getUser();

        if(user.id == null){
            navigate("/login");
        }
        else{
            console.log("Welcome " + user.first_name);
            console.log(user);
        }

    },[]);
    function handleToggle(){
        setToggle(!toggle);
        setActive("timetable");
    }

    return (
    <>
        <Navbar toggle={toggle} handleToggle={handleToggle}/>
        <div className={styles.sectionPadding}>
            {children}
        </div>
        <Footer/>
    </>
    );
}

export default Layout;