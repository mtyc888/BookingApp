import React, { useState } from 'react';

const Template1 = ({ patientName, appointmentDate, appointmentTime, headerText, mainText }) => {
    return (
        <section className="max-w-2xl px-6 py-8 mx-auto bg-white dark:bg-gray-900">
            <header>
                <a href="#">
                    <img className="w-auto h-7 sm:h-8" src="https://your-clinic-logo-url.com/logo.svg" alt="Clinic Logo" />
                </a>
            </header>

            <main className="mt-8">
                <h2 className="text-gray-700 dark:text-gray-200">{headerText} {patientName},</h2>
                <p className="mt-2 leading-loose text-gray-600 dark:text-gray-300">
                    {mainText}
                </p>
                <div className="mt-4">
                    <p className="text-xl font-medium text-gray-700 dark:text-gray-200">Date: {appointmentDate}</p>
                    <p className="mt-2 text-xl font-medium text-gray-700 dark:text-gray-200">Time: {appointmentTime}</p>
                </div>
                <p className="mt-4 leading-loose text-gray-600 dark:text-gray-300">
                    Please ensure you arrive on time. If you need to reschedule or cancel, contact our clinic at least 24 hours prior to your appointment.
                </p>
                <button className="px-6 py-2 mt-6 text-sm font-medium tracking-wider text-white capitalize transition-colors duration-300 transform bg-blue-600 rounded-lg hover:bg-blue-500 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-80">
                    View Appointment Details
                </button>
                <p className="mt-8 text-gray-600 dark:text-gray-300">
                    Thanks, <br />
                    [Your Clinic Name]
                </p>
            </main>
            <footer className="mt-8">
                <p className="text-gray-500 dark:text-gray-400">
                    If you have any queries or concerns, feel free to reach out at <a href="mailto:clinic@email.com" className="text-blue-600 hover:underline dark:text-blue-400">clinic@email.com</a>. 
                </p>
                <p className="mt-3 text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} [Your Clinic Name]. All Rights Reserved.</p>
            </footer>
        </section>
    );
};

const Template2 = ({ patientName, appointmentDate, appointmentTime, headerText, mainText }) => (
    <section className="max-w-2xl px-6 py-8 mx-auto bg-white dark:bg-gray-900">
        <div className="bg-white text-gray-800 font-sans">
            <div className="hidden overflow-hidden h-0 opacity-0" id="__react-email-preview">
                Booking confirmation for your upcoming appointment.
            </div>

            <div className="max-w-xl mx-auto p-5">
                <table className="w-full">
                    <tbody>
                        <tr>
                            <td className="text-center">
                                <img alt="Medical Logo" src="path_to_your_medical_logo.png" className="w-8 h-8 mx-auto block" />
                                <p className="text-xl font-bold mt-4">
                                    {headerText} {patientName}, {mainText}
                                </p>

                                <div className="p-6 border border-gray-300 rounded text-center mt-4">
                                    <p className="text-sm leading-6 mb-2 text-left">Dear <strong>{patientName}</strong>,</p>
                                    <p className="text-sm leading-6 mb-2 text-left">
                                        We are pleased to confirm your appointment on <strong>{appointmentDate}</strong> at <strong>{appointmentTime}</strong>. Please ensure you arrive 10 minutes before your scheduled time.
                                    </p>
                                    <a href="#" target="_blank" className="text-sm bg-blue-600 text-white rounded px-6 py-2 inline-block mt-4 hover:bg-blue-700">View Appointment Details</a>
                                </div>

                                <p className="text-sm leading-6 mt-4 text-center">
                                    <a href="#" target="_blank" className="text-blue-500 hover:underline mr-4">Reschedule</a> ・ 
                                    <a href="#" target="_blank" className="text-blue-500 hover:underline ml-4">Contact Us</a>
                                </p>

                                <p className="text-xs leading-6 mt-16 text-gray-600 text-center">
                                    Medical Center Name ・123 Medical St ・Your City, ZIP Code
                                </p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </section>
);

const Template = ({ templateNumber, patientName, appointmentDate, appointmentTime }) => {
  const [headerText, setHeaderText] = useState("Hi");
  const [mainText, setMainText] = useState("Your appointment has been confirmed!");
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState("");  // To display messages to the user.

  const saveTemplateToDatabase = async () => {
    try {
        const templateContent = {
            patientName,
            appointmentDate,
            appointmentTime,
            headerText,
            mainText
        };

        const response = await fetch('http://127.0.0.1:8000/save_template/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                templateName: `Template ${templateNumber}`,
                templateContent
            })
        });

        const data = await response.json();
        if (response.ok) {
            setMessage(data.message);
        } else {
            setMessage(data.error || 'Error saving template.');
        }
    } catch (error) {
        setMessage('Error saving template.');
        console.error('Error saving template:', error);
    }
};

  return (
      <div>
          {editMode && (
              <div className="mb-4">
                  <input 
                      value={headerText} 
                      onChange={(e) => setHeaderText(e.target.value)} 
                      className="border rounded p-2 w-full"
                  />
                  <textarea 
                      value={mainText} 
                      onChange={(e) => setMainText(e.target.value)} 
                      className="border rounded p-2 w-full mt-2"
                      rows="3"
                  />
              </div>
          )}
          {templateNumber === 1 && <Template1 patientName={patientName} appointmentDate={appointmentDate} appointmentTime={appointmentTime} headerText={headerText} mainText={mainText} />}
          {templateNumber === 2 && <Template2 patientName={patientName} appointmentDate={appointmentDate} appointmentTime={appointmentTime} headerText={headerText} mainText={mainText} />}
          <button 
                onClick={() => setEditMode(!editMode)}
                className="mt-4 bg-gray-300 rounded p-2 mr-2"
            >
                {editMode ? "Save Edits" : "Edit"}
            </button>
          <button 
                onClick={saveTemplateToDatabase}
                className="mt-4 bg-green-500 text-white rounded p-2"
            >
                Save Template to Database
            </button>
          {message && <p className="mt-2 text-red-600">{message}</p>}
      </div>
  );
};

export default Template;
