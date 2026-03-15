import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import { setAuthTokenGetter } from "../../services/api";
import useFileStore from "../../store/useFileStore";

const AuthSetup = () => {
  const { getToken, isSignedIn, userId } = useAuth();
  const resetForUser = useFileStore((state) => state.resetForUser);
  const loadFileSystem = useFileStore((state) => state.loadFileSystem);

  useEffect(() => {
    setAuthTokenGetter(getToken);

    return () => {
      setAuthTokenGetter(null);
    };
  }, [getToken]);

  useEffect(() => {
    if (!isSignedIn || !userId) {
      resetForUser();
      return;
    }

    // On user switch, clear old tree first, then fetch user-scoped data.
    resetForUser();
    loadFileSystem();
  }, [isSignedIn, userId, resetForUser, loadFileSystem]);

  return null;
};

export default AuthSetup;
