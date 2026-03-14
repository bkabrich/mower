import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { MapControlScreen } from './pages/MapControlScreen'

function Nav() {
  const location = useLocation()
  return (
    <nav className="flex gap-4">
      <Link
        to="/"
        className={`text-sm font-medium ${
          location.pathname === '/' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        Home
      </Link>
      <Link
        to="/map"
        className={`text-sm font-medium ${
          location.pathname === '/map' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        Map &amp; Mowing
      </Link>
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-3">
          <h1 className="text-lg font-semibold sm:text-xl">Vineyard Mower Dashboard</h1>
          <Nav />
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<MapControlScreen />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
