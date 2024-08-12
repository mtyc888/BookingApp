// src/components/TemplateList.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';  // Ensure axios is installed using npm

function TemplateList({ onTemplateSelect }) {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTemplates() {
            try {
                const response = await axios.get('http://your-django-backend-url/templates/');
                setTemplates(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching the templates:", error);
                setLoading(false);
            }
        }

        fetchTemplates();
    }, []);

    return (
        <div>
            {loading ? <div>Loading templates...</div> : (
                <div className="template-list">
                    {templates.map(template => (
                        <div key={template.id} onClick={() => onTemplateSelect(template)}>
                            <h3>{template.title}</h3>
                            <p>{template.content}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default TemplateList;
