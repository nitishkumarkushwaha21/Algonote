import React from "react";
import { SignIn } from "@clerk/react";

const SignInPage = () => {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
      />
    </div>
  );
};

export default SignInPage;
