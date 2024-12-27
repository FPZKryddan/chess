/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export function useSocket(url, options) {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io(url, options);
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        }
    }, [])

    if (import.meta && import.meta.hot) {
        import.meta.hot.dispose(() => {
          socket?.disconnect();
        });
    }

    return socket;
}