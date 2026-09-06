import { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import AppRoutes from "./routes";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans antialiased">
        {/* Mobile sidebar backdrop overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-xs transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Persistent Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Persistent Navbar */}
          <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          {/* Page Route Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              <AppRoutes />
            </div>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;