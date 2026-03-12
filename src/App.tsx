import { Dashboard } from './pages/Dashboard'

function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="shrink-0 border-b border-slate-700 bg-slate-800 px-4 py-3">
        <h1 className="text-lg font-semibold sm:text-xl">
          Vineyard Mower Dashboard
        </h1>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <Dashboard />
      </main>
    </div>
  )
}

export default App
