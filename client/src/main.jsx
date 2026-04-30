import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/react";
import "./index.css";
import App from "./App.jsx";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const authOrigin =
  typeof window !== "undefined" ? window.location.origin : "";
const authHomeUrl = authOrigin ? `${authOrigin}/` : "/";
const authSignInUrl = authOrigin ? `${authOrigin}/sign-in` : "/sign-in";
const authSignUpUrl = authOrigin ? `${authOrigin}/sign-up` : "/sign-up";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {clerkPublishableKey ? (
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        signInForceRedirectUrl={authHomeUrl}
        signUpForceRedirectUrl={authHomeUrl}
        signInFallbackRedirectUrl={authHomeUrl}
        signUpFallbackRedirectUrl={authHomeUrl}
        afterSignOutUrl={authSignInUrl}
      >
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
        Missing VITE_CLERK_PUBLISHABLE_KEY in root .env
      </div>
    )}
  </StrictMode>,
);
