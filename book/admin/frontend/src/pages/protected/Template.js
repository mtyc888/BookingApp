import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setPageTitle } from '../../features/common/headerSlice'
import React, { useState } from 'react';
import Template from '../../features/settings/template';
import TemplatePicker from '../../features/settings/template';

function InternalPage(){
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(setPageTitle({ title : "Template"}))
      }, [])
      const [selectedTemplate, setSelectedTemplate] = useState();
    return(
        <>
        <div>
            <div>
                <button onClick={() => setSelectedTemplate(1)} className='border w-40 h-10 rounded-xl bg-yellow-400'>Select Template 1</button>
                <button onClick={() => setSelectedTemplate(2)} className='border w-40 h-10 rounded-xl bg-yellow-400'>Select Template 2</button>
            </div>
            <div>
                <Template templateNumber={selectedTemplate} />
            
            </div>
        </div>
        </>
    )
}

export default InternalPage