import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAppointments } from "../AppointmentsContext";

function Layout({children}){
    return (
    <>
        <div className="flex flex-col lg:flex-row w-full h-[100vh]">
            <div style={{flex: 1, overflow: "auto"}}>
                {children}
            </div>
            <div className="hidden lg:block w-full lg:w-[45vw] h-full bg-primary-900">
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63653.570922900966!2d113.95914171537767!3d4.3455973608899106!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x321f48bbe03f7429%3A0x6a7dcb869c5c1d62!2sMiri%20Marina!5e0!3m2!1sen!2smy!4v1695564714850!5m2!1sen!2smy" class="w-full h-full" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
            </div>
        </div>
    </>
    );
}

export default Layout;