import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Customers from "./Customers";

import Treatments from "./Treatments";

import Appointments from "./Appointments";

import ServiceMenus from "./ServiceMenus";

import Staff from "./Staff";

import LoadMenus from "./LoadMenus";

import ImportCustomers from "./ImportCustomers";

import GrantAdminAccess from "./GrantAdminAccess";

import StaffEvaluation from "./StaffEvaluation";

import Attendance from "./Attendance";

import CashBook from "./CashBook";

import CustomerConsent from "./CustomerConsent";

import StaffTreatments from "./StaffTreatments";

import Statistics from "./Statistics";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Customers: Customers,
    
    Treatments: Treatments,
    
    Appointments: Appointments,
    
    ServiceMenus: ServiceMenus,
    
    Staff: Staff,
    
    LoadMenus: LoadMenus,
    
    ImportCustomers: ImportCustomers,
    
    GrantAdminAccess: GrantAdminAccess,
    
    StaffEvaluation: StaffEvaluation,
    
    Attendance: Attendance,
    
    CashBook: CashBook,
    
    CustomerConsent: CustomerConsent,
    
    StaffTreatments: StaffTreatments,
    
    Statistics: Statistics,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Customers" element={<Customers />} />
                
                <Route path="/Treatments" element={<Treatments />} />
                
                <Route path="/Appointments" element={<Appointments />} />
                
                <Route path="/ServiceMenus" element={<ServiceMenus />} />
                
                <Route path="/Staff" element={<Staff />} />
                
                <Route path="/LoadMenus" element={<LoadMenus />} />
                
                <Route path="/ImportCustomers" element={<ImportCustomers />} />
                
                <Route path="/GrantAdminAccess" element={<GrantAdminAccess />} />
                
                <Route path="/StaffEvaluation" element={<StaffEvaluation />} />
                
                <Route path="/Attendance" element={<Attendance />} />
                
                <Route path="/CashBook" element={<CashBook />} />
                
                <Route path="/CustomerConsent" element={<CustomerConsent />} />
                
                <Route path="/StaffTreatments" element={<StaffTreatments />} />
                
                <Route path="/Statistics" element={<Statistics />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}