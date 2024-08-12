import { useState, useEffect } from "react";
import {API_URL} from "../config.js";
import { useLocation, useNavigate} from "react-router-dom";
import QueryString from "query-string";
import styles from "../styles.js";
import sparks from "../assets/sparks.png";
function StripeDeposit(){
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check to see if this is a redirect back from Checkout
    // const query = new URLSearchParams(window.location.search);
    const values = QueryString.parse(location.search);
    console.log(values);
    
    if (values.success) {
        navigate('/booking-success'); 
    }

    if (values.canceled) {
        navigate('/booking-canceled'); 
    }
  }, []);

  return (  
    <section>
        <div className="product">
        <img
            src={sparks}
            alt="Sparks Bookit"
        />
        <div className="description">
        <h3>Bookit (One month)</h3>
        <h5>$20.00</h5>
        </div>
        </div>
        <form action={`${API_URL}/create-checkout-session`} method="POST">
        <button type="submit" className={styles.primaryButton}>
            Checkout
        </button>
        </form>
    </section>
  );
}


export default StripeDeposit;