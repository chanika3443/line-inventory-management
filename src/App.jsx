import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LiffProvider } from './contexts/LiffContext'
import { SheetsProvider } from './contexts/SheetsContext'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Withdraw from './pages/Withdraw'
import Receive from './pages/Receive'
import Return from './pages/Return'
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import Logs from './pages/Logs'
import Products from './pages/Products'

function App() {
  return (
    <BrowserRouter basename="/line-inventory-management/">
      <ScrollToTop />
      <LiffProvider>
        <SheetsProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="withdraw" element={<Withdraw />} />
              <Route path="receive" element={<Receive />} />
              <Route path="return" element={<Return />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="reports" element={<Reports />} />
              <Route path="logs" element={<Logs />} />
              <Route path="products" element={<Products />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </SheetsProvider>
      </LiffProvider>
    </BrowserRouter>
  )
}

export default App
