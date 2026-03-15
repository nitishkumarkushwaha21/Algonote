import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  ClerkLoaded,
  ClerkLoading,
  RedirectToSignIn,
  useAuth,
} from "@clerk/react";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import FolderView from "./pages/FolderView";
import ProblemWorkspace from "./components/layout/ProblemWorkspace";
import PlaylistFeaturePage from "./pages/PlaylistFeaturePage";
import ProfileAnalysisPage from "./pages/profile-analysis/ProfileAnalysisPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import AuthSetup from "./components/auth/AuthSetup";

const ProtectedLayout = () => {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return <RedirectToSignIn redirectUrl="/" />;
  }

  return (
    <>
      <AuthSetup />
      <Layout />
    </>
  );
};

function App() {
  return (
    <>
      <ClerkLoading>
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
          Loading authentication...
        </div>
      </ClerkLoading>

      <ClerkLoaded>
        <Routes>
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />

          <Route path="/" element={<ProtectedLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="folder/:id" element={<FolderView />} />
            <Route path="problem/:id" element={<ProblemWorkspace />} />
            <Route path="playlist" element={<PlaylistFeaturePage />} />
            <Route path="profile-analysis" element={<ProfileAnalysisPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ClerkLoaded>
    </>
  );
}

export default App;
