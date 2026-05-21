import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { HelmetProvider } from "react-helmet-async";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.jsx";
import { store } from "./store/store.js";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const appTree = (
  <BrowserRouter>
    <App />
    <Toaster position="top-right" />
  </BrowserRouter>
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        {googleClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>{appTree}</GoogleOAuthProvider>
        ) : (
          appTree
        )}
      </Provider>
    </HelmetProvider>
  </StrictMode>
);
