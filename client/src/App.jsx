import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import {
  ClerkLoaded,
  ClerkLoading,
  useAuth,
} from "@clerk/react";
import AppLayout from "./components/layout/AppLayout";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import AuthSetup from "./components/auth/AuthSetup";
import LoginPage from "./loginpage/LoginPage";
import SignUpPageCustom from "./loginpage/SignUpPageCustom";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";

const HeroPage = lazy(() => import("./hero/HeroPage"));
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const FolderDetailsPage = lazy(
  () => import("./pages/folders/FolderDetailsPage"),
);
const PlaylistSheetsPage = lazy(
  () => import("./pages/playlist/PlaylistSheetsPage"),
);
const LeetCodeListPage = lazy(
  () => import("./pages/leetcode-list/LeetCodeListPage"),
);
const ProblemEditorPage = lazy(
  () => import("./pages/problem/ProblemEditorPage"),
);
const ProfileAnalysisPage = lazy(
  () => import("./pages/profile-analysis/ProfileAnalysisPage"),
);
const PageLoader = () => (
  <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
    Loading page...
  </div>
);

const ProtectedLayout = () => {
  const { isSignedIn } = useAuth();
  const location = useLocation();

  if (!isSignedIn && location.pathname === "/") {
    return <HeroPage />;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <>
      <AuthSetup />
      <AppLayout />
    </>
  );
};

const HomeEntryRoute = () => {
  const { isSignedIn } = useAuth();

  return <Navigate to={isSignedIn ? "/" : "/sign-in"} replace />;
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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/demologin" element={<Navigate to="/sign-in" replace />} />
            <Route path="/home" element={<HomeEntryRoute />} />
            <Route path="/heropage" element={<HeroPage />} />
            <Route path="/sign-in/forgot-password/*" element={<SignInPage />} />
            <Route path="/sign-in/sso-callback/*" element={<OAuthCallbackPage />} />
            <Route path="/sign-in/*" element={<LoginPage />} />
            <Route path="/sign-up/*" element={<SignUpPageCustom />} />

            <Route path="/" element={<ProtectedLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="folder/:id" element={<FolderDetailsPage />} />
              <Route path="problem/:id" element={<ProblemEditorPage />} />
              <Route path="playlist" element={<PlaylistSheetsPage />} />
              <Route path="leetcode-list" element={<LeetCodeListPage />} />
              <Route
                path="profile-analysis"
                element={<ProfileAnalysisPage />}
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ClerkLoaded>
    </>
  );
}

export default App;
