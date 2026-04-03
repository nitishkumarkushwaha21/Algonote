import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import {
  setAuthTokenGetter,
  setAuthUserIdGetter,
  statsService,
} from "../../services/api";
import useFileStore from "../../store/useFileStore";

const AuthSetup = () => {
  const { getToken, isSignedIn, userId, sessionId } = useAuth();
  const resetForUser = useFileStore((state) => state.resetForUser);
  const loadFileSystem = useFileStore((state) => state.loadFileSystem);

  useEffect(() => {
    setAuthTokenGetter(getToken);
    setAuthUserIdGetter(() => userId || null);

    return () => {
      setAuthTokenGetter(null);
      setAuthUserIdGetter(null);
    };
  }, [getToken, userId]);

  useEffect(() => {
    if (!isSignedIn || !userId) {
      setAuthUserIdGetter(null);
      resetForUser();
      return;
    }

    // On user switch, clear old tree first, then fetch user-scoped data.
    resetForUser();
    loadFileSystem();
  }, [isSignedIn, userId, resetForUser, loadFileSystem]);

  useEffect(() => {
    if (!isSignedIn || !userId || !sessionId || typeof window === "undefined") {
      return;
    }

    const storageKey = `algonote-login-recorded:${sessionId}`;
    if (window.sessionStorage.getItem(storageKey) === "true") {
      return;
    }

    statsService
      .recordLogin(sessionId)
      .then(({ data }) => {
        window.sessionStorage.setItem(storageKey, "true");
        window.dispatchEvent(
          new CustomEvent("algonote:login-count-updated", {
            detail: { totalLogins: data?.totalLogins ?? null },
          }),
        );
      })
      .catch((error) => {
        console.error("Failed to record login", error);
      });
  }, [isSignedIn, userId, sessionId]);

  return null;
};

export default AuthSetup;
