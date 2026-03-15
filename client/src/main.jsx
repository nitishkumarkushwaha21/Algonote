import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/react";
import "./index.css";
import App from "./App.jsx";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {clerkPublishableKey ? (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    ) : (
      <div
        style={{
          padding: "24px",
          color: "#fff",
          background: "#111",
          minHeight: "100vh",
        }}
      >
        Missing VITE_CLERK_PUBLISHABLE_KEY in client/.env
      </div>
    )}
  </StrictMode>,
);
