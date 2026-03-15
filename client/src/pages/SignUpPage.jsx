import React from "react";
import { SignUp } from "@clerk/react";

const SignUpPage = () => {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
      />
    </div>
  );
};

export default SignUpPage;
