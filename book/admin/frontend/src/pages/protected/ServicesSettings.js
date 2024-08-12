import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setPageTitle } from '../../features/common/headerSlice'
import ServicesSettings from '../../features/settings/servicesetting'

function InternalPage(){
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(setPageTitle({ title : "Settings"}))
      }, [])


    return(
        <ServicesSettings />
    )
}

export default InternalPage