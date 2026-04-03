import React from "react";
import { SignUp } from "@clerk/react";
import AuthPageShell from "../loginpage/AuthPageShell";

const SignUpPage = () => {
  return (
    <AuthPageShell
      title="Join AlgoNote"
      subtitle="Create your account to get started"
    >
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
        appearance={{
          layout: {
            socialButtonsPlacement: "bottom",
            socialButtonsVariant: "blockButton",
          },
          elements: {
            rootBox: "clerk-root",
            card: "clerk-card",
            header: "clerk-header",
            headerTitle: "clerk-header-title",
            headerSubtitle: "clerk-header-subtitle",
            main: "clerk-main",
            form: "clerk-form",
            formFieldRow: "clerk-form-row",
            formButtonPrimary: "clerk-primary-button",
            formFieldInput: "clerk-input",
            formFieldLabel: "clerk-label",
            footer: "clerk-footer",
            footerAction: "clerk-footer-action",
            footerActionLink: "clerk-link",
            socialButtonsBlockButton: "clerk-social-button",
            socialButtonsBlockButtonText: "clerk-social-button-text",
            socialButtonsIconButton: "clerk-social-button",
            socialButtonsProviderIcon: "clerk-social-provider-icon",
            dividerLine: "clerk-divider-line",
            dividerText: "clerk-divider-text",
            dividerRow: "clerk-divider-row",
            formFieldErrorText: "clerk-error",
            identityPreviewText: "clerk-identity-preview-text",
            formResendCodeLink: "clerk-link",
            otpCodeFieldInput: "clerk-input",
          },
        }}
      />
    </AuthPageShell>
  );
};

export default SignUpPage;
