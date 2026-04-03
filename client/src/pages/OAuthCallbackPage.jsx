import React from "react";
import { AuthenticateWithRedirectCallback } from "@clerk/react";

const OAuthCallbackPage = () => {
  return (
    <div className="min-h-screen bg-[#f5f1e7] text-slate-900 flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Completing sign in</h1>
        <p className="mt-3 text-base text-slate-600">
          Please wait while we finish your Google authentication.
        </p>
        <AuthenticateWithRedirectCallback />
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
