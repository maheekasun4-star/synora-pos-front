import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import './index.css';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import POSLayout from './components/POSLayout.jsx';
import BackofficeLayout from './components/BackofficeLayout.jsx';

import Login from './pages/Login.jsx';
import POSOutletSelect from './pages/POSOutletSelect.jsx';
import TableLayout from './pages/TableLayout.jsx';
import OrderScreen from './pages/OrderScreen.jsx';
import BillScreen from './pages/BillScreen.jsx';
import KitchenDisplay from './pages/KitchenDisplay.jsx';
import POSReports from './pages/POSReports.jsx';
import MenuConfig from './pages/backoffice/MenuConfig.jsx';
import TableConfig from './pages/backoffice/TableConfig.jsx';
import TaxConfig from './pages/backoffice/TaxConfig.jsx';
import DiscountConfig from './pages/backoffice/DiscountConfig.jsx';
import PrinterConfig from './pages/backoffice/PrinterConfig.jsx';
import UserManagement from './pages/backoffice/UserManagement.jsx';
import OutletConfig from './pages/backoffice/OutletConfig.jsx';

const routes = [
  { path: '/login', element: <Login /> },
  {
    // Protected routes
    element: <ProtectedRoute />,
    children: [
      {
        element: <POSLayout />,
        children: [
          { index: true, element: <Navigate to="/outlets" replace /> },
          { path: 'outlets', element: <POSOutletSelect /> },
          { path: 'outlets/:outletId', element: <TableLayout /> },
          { path: 'orders/:orderId', element: <OrderScreen /> },
          { path: 'kitchen', element: <KitchenDisplay /> },
          { path: 'bills/:billId', element: <BillScreen /> },
          { path: 'reports', element: <POSReports /> },
        ],
      },
      {
        path: 'backoffice',
        element: <AdminRoute />,
        children: [
          {
            element: <BackofficeLayout />,
            children: [
              { index: true, element: <Navigate to="/backoffice/menu" replace /> },
              { path: 'menu', element: <MenuConfig /> },
              { path: 'outlets', element: <OutletConfig /> },
              { path: 'tables', element: <TableConfig /> },
              { path: 'taxes', element: <TaxConfig /> },
              { path: 'discounts', element: <DiscountConfig /> },
              { path: 'printers', element: <PrinterConfig /> },
              { path: 'users', element: <UserManagement /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/outlets" replace /> },
];

const router = createBrowserRouter(routes, {
  future: { v7_relativeSplatPath: true, v7_startTransition: true },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
