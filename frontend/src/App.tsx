import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import ListPage from './pages/ListPage';
import EditorPage from './pages/EditorPage';
import CalculatorPage from './pages/CalculatorPage';

// 内部组件用于使用useLocation
function AppContent() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-from to-brand-to">
      {/* 导航栏 - 移动端优化 */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
        <nav className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white whitespace-nowrap">
              FormulaCalc
            </h1>
            <ul className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
              <li>
                <Link
                  to="/"
                  className={`px-4 py-2 sm:px-5 sm:py-2 rounded-lg transition-all duration-300 text-sm sm:text-base font-medium touch-manipulation ${
                    location.pathname === '/'
                      ? 'bg-white text-brand-from shadow-lg'
                      : 'text-white hover:bg-white/20 hover:shadow-md'
                  }`}
                >
                  计算器列表
                </Link>
              </li>
              <li>
                <Link
                  to="/new"
                  className={`px-4 py-2 sm:px-5 sm:py-2 rounded-lg transition-all duration-300 text-sm sm:text-base font-medium touch-manipulation ${
                    location.pathname === '/new'
                      ? 'bg-white text-brand-from shadow-lg'
                      : 'text-white hover:bg-white/20 hover:shadow-md'
                  }`}
                >
                  新建计算器
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      {/* 主内容区域 - 移动端优化 */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <Routes>
          <Route path="/" element={<ListPage />} />
          <Route path="/new" element={<EditorPage />} />
          <Route path="/edit/:id" element={<EditorPage />} />
          <Route path="/calculator/:id" element={<CalculatorPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router basename={import.meta.env.VITE_BASE}>
      <AppContent />
    </Router>
  );
}

export default App;
