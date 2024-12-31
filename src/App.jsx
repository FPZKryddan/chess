import React, { useState, useEffect, useRef } from "react";
import { movesSearchFunctions } from "../server/src/chess/utils/moves";
import { useSocket } from "./hooks/useSocket";
import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Chess from "./routes/chess.jsx";
import Home from "./routes/Home.jsx";
import Navbar from "./components/Navbar.jsx";
import Header from "./components/Header.jsx";
import Auth from "./routes/Auth.jsx";
import Profile from "./routes/Profile.jsx";
import { useAuth } from "./contexts/AuthProvider.jsx";
import { SocketProvider } from "./contexts/SocketProvider.jsx";
import { useToast } from "./contexts/ToastProvider.jsx";
import { ChessLobby } from "./routes/ChessLobby.jsx";


function App() {
  const authData = useAuth();
  const navigate = useNavigate();
  const {createToast, createChallengeToast} = useToast();

  const socket = useSocket("http://localhost:3000/", {
    transports: ["websocket"],
    cors: {
      origin: "*",
    },
  });

  useEffect(() => {
    if (!socket) return;

    socket.on("join", (event) => {
      console.log("connected: ", event.message);
    });

    socket.on("challenge:request", (event) => {
      const challengeId = event.challengeId
      const challenger = event.challenger
      console.log("Challenge request recieved:", event)
      createChallengeToast(challenger.displayName + " has challenged you to a game!", acceptChallenge, denyChallenge, challengeId);
    })

    socket.on("game:created", (event) => {
      console.log(event);
      const url = "/chess/" + event
      navigate(url);
    })

    return () => {
      socket.off("join");
      socket.off("challenge:request");
    };
  }, [socket]);

  const acceptChallenge = (challengeId) => {
    socket.emit("challenge:accept", challengeId);
  }

  const denyChallenge = (challengeId) => {
    socket.emit("challenge:deny", challengeId);
  }

  return (
    <SocketProvider socket={socket}>
      {/* <Header></Header> */}
      <Navbar></Navbar>
      <div className="flex justify-center align-middle w-screen h-screen bg-primary-grey">
        <Routes>
          <Route path="/" Component={Home}></Route>
          <Route
            path="/auth"
            element={authData.currentUser ? <Navigate to="/" /> : <Auth />}
            ></Route>
          <Route
            path="/profile"
            element={authData.currentUser ? <Profile /> : <Navigate to="/auth" />}
            ></Route>
          <Route
            path="/profile/:uid"
            element={<Profile />}
            ></Route>
          <Route
            path="/chess"
            element={authData.currentUser ? <ChessLobby /> : <Navigate to="/auth" />}
          ></Route>
          <Route
            path="/chess/:id"
            element={authData.currentUser ? <Chess /> : <Navigate to="/auth" />}
          ></Route>
          <Route path="*" element={<h1>ERROR 404: PAGE NOT FOUND</h1>}></Route>
        </Routes>
      </div>
    </SocketProvider>
  );
}

export default App;
