import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import store from './app/store'
import { Provider } from 'react-redux'
import SuspenseContent from './containers/SuspenseContent';
import { UserProvider } from './features/user/components/UserContext'; // <-- import the context

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Suspense fallback={<SuspenseContent />}>
        <Provider store={store}>
            <UserProvider>  {/* <-- Use the provider here */}
                <App />
            </UserProvider>
        </Provider>
    </Suspense>
);

reportWebVitals();
