import { Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import Header from './components/Header'
import Landing from './pages/Landing'
import DomainPage from './pages/DomainPage'
import WorkstationRouter from './pages/WorkstationRouter'
import LoginPage from './pages/LoginPage'

function AuthenticatedApp() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/domain/:domainId" element={<DomainPage />} />
        <Route path="/domain/:domainId/workstation/:useCaseId" element={<WorkstationRouter />} />
      </Routes>
    </>
  )
}

function AppContent() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <LoginPage />
  }
  return <AuthenticatedApp />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
