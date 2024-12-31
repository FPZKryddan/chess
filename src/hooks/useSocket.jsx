/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../contexts/AuthProvider";

export function useSocket(url, options) {
  const [socket, setSocket] = useState(null);
  const userData = useAuth();

  useEffect(() => {
    if (!userData.currentUser) return;
    const newSocket = io(url, {
      ...options,
      auth: {
        uid: userData.currentUser.uid
      }
    });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userData]);

  if (import.meta && import.meta.hot) {
    import.meta.hot.dispose(() => {
      socket?.disconnect();
    });
  }

  return socket;
}
