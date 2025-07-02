import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import ListPage from './pages/ListPage';
import EditorPage from './pages/EditorPage';
import CalculatorPage from './pages/CalculatorPage';

function App() {
  const activeLinkStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    fontWeight: '600',
  };

  return (
    <Router basename={import.meta.env.VITE_BASE}>
      <div className="min-h-screen bg-gradient-to-br from-brand-from to-brand-to text-white font-sans">
        <header className="p-4 shadow-md bg-white/5">
          <nav className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
            <h1 className="text-lg sm:text-2xl font-bold whitespace-nowrap truncate">FormulaCalc</h1>
            <ul className="flex flex-wrap items-center gap-2 sm:gap-4">
              <li>
                <NavLink 
                  to="/" 
                  className="px-3 py-1 sm:px-4 sm:py-2 rounded-md transition text-sm sm:text-base"
                  style={({ isActive }) => isActive ? activeLinkStyle : {}}
                >
                  My Calculators
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/new" 
                  className="px-3 py-1 sm:px-4 sm:py-2 rounded-md transition text-sm sm:text-base"
                  style={({ isActive }) => isActive ? activeLinkStyle : {}}
                >
                  Create New
                </NavLink>
              </li>
            </ul>
          </nav>
        </header>
        <main className="container mx-auto p-4 md:p-8">
          <Routes>
            <Route path="/" element={<ListPage />} />
            <Route path="/new" element={<EditorPage />} />
            <Route path="/edit/:id" element={<EditorPage />} />
            <Route path="/calculator/:id" element={<CalculatorPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
