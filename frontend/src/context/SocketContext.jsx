import { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import API_BASE_URL from "config";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const user = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);

  useEffect(() => {
    if (!user?._id || !token) return;

    const socket = io(API_BASE_URL, {
      query: { userId: user._id },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [user?._id, token]);

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  );
};
