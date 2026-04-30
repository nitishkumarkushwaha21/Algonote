import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import {
  setAuthTokenGetter,
  setAuthUserIdGetter,
  statsService,
} from "../../services/api";
import useFileStore from "../../store/useFileStore";

const AuthSetup = () => {
  const { getToken, isLoaded, isSignedIn, userId, sessionId } = useAuth();
  const resetForUser = useFileStore((state) => state.resetForUser);
  const loadFileSystem = useFileStore((state) => state.loadFileSystem);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    setAuthTokenGetter(getToken);
    setAuthUserIdGetter(() => userId || null);
  }, [getToken, isLoaded, userId]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn || !userId) {
      setAuthTokenGetter(null);
      setAuthUserIdGetter(null);
      resetForUser();
      return;
    }

    let cancelled = false;

    const bootstrapUserData = async () => {
      // On user switch, clear old tree first, then fetch user-scoped data.
      resetForUser();

      const loaded = await loadFileSystem({ force: true });
      if (!loaded && !cancelled) {
        console.error("Initial file system load did not complete");
      }
    };

    bootstrapUserData();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId, resetForUser, loadFileSystem]);

  useEffect(() => {
    if (
      !isLoaded ||
      !isSignedIn ||
      !userId ||
      !sessionId ||
      typeof window === "undefined"
    ) {
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
  }, [isLoaded, isSignedIn, userId, sessionId]);

  return null;
};

export default AuthSetup;
