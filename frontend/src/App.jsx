import { WallpaperProvider } from "./context/WallpaperContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import ChatPage from './pages/ChatPage.jsx';
import { Navigate, Route, Routes } from 'react-router-dom';
import AuthPage from './pages/AuthPage.jsx';
import { useAuth } from "@clerk/react";
import PageLoader from "./components/PageLoader.jsx";
import { useAuthStore } from "./store/useAuthStore.js";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast"
 
function App() {

  const { isSignedIn, isLoaded } = useAuth();

  const clearAuth = useAuthStore((state) => state.clearAuth);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);

  useEffect(() => {
    if(!isLoaded) return;

    if(isSignedIn) checkAuth();
  },[checkAuth, clearAuth, isLoaded, isSignedIn])

  if(!isLoaded || (isSignedIn && isCheckingAuth)) return <PageLoader />;

  return (
    <ThemeProvider>
    <WallpaperProvider>
      <Routes>
        <Route path="/" element={isSignedIn ? <ChatPage /> : <Navigate to={"/auth"} replace />}/>
        <Route path="/auth" element={!isSignedIn ? <AuthPage /> : <Navigate to={"/"} replace/>}/>
      </Routes>
      <Toaster />
    </WallpaperProvider>
    </ThemeProvider>
  )
}

export default App
