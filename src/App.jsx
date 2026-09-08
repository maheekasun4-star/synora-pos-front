import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import POSLayout from './components/POSLayout.jsx';
import BackofficeLayout from './components/BackofficeLayout.jsx';

import Login           from './pages/Login.jsx';
import POSOutletSelect from './pages/POSOutletSelect.jsx';
import TableLayout     from './pages/TableLayout.jsx';
import OrderScreen     from './pages/OrderScreen.jsx';
import BillScreen      from './pages/BillScreen.jsx';
import POSReports      from './pages/POSReports.jsx';
import MenuConfig      from './pages/backoffice/MenuConfig.jsx';
import TableConfig     from './pages/backoffice/TableConfig.jsx';
import TaxConfig       from './pages/backoffice/TaxConfig.jsx';
import DiscountConfig  from './pages/backoffice/DiscountConfig.jsx';
import PrinterConfig   from './pages/backoffice/PrinterConfig.jsx';
import UserManagement  from './pages/backoffice/UserManagement.jsx';
import OutletConfig    from './pages/backoffice/OutletConfig.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<POSLayout />}>
            <Route index element={<Navigate to="/outlets" replace />} />
            <Route path="outlets"              element={<POSOutletSelect />} />
            <Route path="outlets/:outletId"    element={<TableLayout />} />
            <Route path="orders/:orderId"      element={<OrderScreen />} />
            <Route path="bills/:billId"        element={<BillScreen />} />
            <Route path="reports"              element={<POSReports />} />
          </Route>

          <Route path="backoffice" element={<AdminRoute />}>
            <Route element={<BackofficeLayout />}>
              <Route index element={<Navigate to="/backoffice/menu" replace />} />
              <Route path="menu" element={<MenuConfig />} />
              <Route path="outlets" element={<OutletConfig />} />
              <Route path="tables" element={<TableConfig />} />
              <Route path="taxes" element={<TaxConfig />} />
              <Route path="discounts" element={<DiscountConfig />} />
              <Route path="printers" element={<PrinterConfig />} />
              <Route path="users" element={<UserManagement />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/outlets" replace />} />
      </Routes>
    </AuthProvider>
  );
}
