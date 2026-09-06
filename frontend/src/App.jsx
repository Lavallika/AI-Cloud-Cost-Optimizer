import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster 
          position="top-right" 
          toastOptions={{ 
            duration: 3000,
            style: {
              background: "#1e293b",
              color: "#f8fafc",
              border: "1px solid #334155",
              fontSize: "13px",
              fontWeight: 500,
            }
          }} 
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;