import React from "react";
import heroImage from "./hero (1).webp";
import "./LoginPage.css";

const AuthPageShell = ({ title, subtitle, children }) => {
  return (
    <div className="auth-page">
      <div className="login-container">
        <div className="login-left">
          <div className="login-content">
            <div className="auth-badge">AlgoNote Workspace</div>
            <div className="login-header auth-shell-header">
              <h1>{title}</h1>
              {subtitle ? <p>{subtitle}</p> : null}
            </div>

            <div className="login-form clerk-form-shell">{children}</div>
          </div>
        </div>

        <div className="login-right">
          <div className="hero-image-container">
            <img src={heroImage} alt="Hero illustration" className="hero-image" />
          </div>
        </div>

        <div className="bottom-welcome">
          <h1>Welcome to AlgoNote</h1>
        </div>
      </div>
    </div>
  );
};

export default AuthPageShell;
