import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import './i18n'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import AdminLayout from './pages/admin/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import Dashboard from './pages/admin/Dashboard'
import PropertyList from './pages/admin/PropertyList'
import PropertyForm from './pages/admin/PropertyForm'
import InquiryList from './pages/admin/InquiryList'
import SpreadsheetAdmin from './pages/admin/SpreadsheetAdmin'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<App />} />

          {/* Admin Login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="properties" element={<PropertyList />} />
            <Route path="properties/new" element={<PropertyForm />} />
            <Route path="properties/:id" element={<PropertyForm />} />
            <Route path="inquiries" element={<InquiryList />} />
            <Route path="spreadsheet" element={<SpreadsheetAdmin />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<App />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
