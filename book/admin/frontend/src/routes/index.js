// All components mapping with path for internal routes

import { lazy } from 'react'

const Dashboard = lazy(() => import('../pages/protected/Dashboard'))
const Calendar = lazy(() => import('../pages/protected/Calendar'))
const Team = lazy(() => import('../pages/protected/Team'))
const ServicesSettings = lazy(() => import('../pages/protected/ServicesSettings'))
const NextAppointment = lazy(() => import('../pages/protected/NextAppointment'))
const TemplateSettings = lazy(() => import('../pages/protected/Template'))
const RescheduleAppointment = lazy(() => import('../pages/protected/ReApp'))
const routes = [
  {
    path: '/dashboard', // the url
    component: Dashboard, // view rendered
  },
  {
    path: '/settings-team',
    component: Team,
  },
  {
    path: '/calendar',
    component: Calendar,
  },
  {
    path: '/settings-services',
    component: ServicesSettings,
  },
  {
    path: '/settings-template',
    component: TemplateSettings,
  },
  {
    path: '/nextappointment',
    component: NextAppointment,
  },
  {
    path: '/reschedule',
    component: RescheduleAppointment,
  },
]

export default routes
