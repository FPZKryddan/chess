import React, { useState, useEffect, useRef } from 'react'
import { movesSearchFunctions } from '../server/src/chess/utils/moves'
import { useSocket } from './hooks/useSocket'
import './App.css'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import Chess from './routes/chess.jsx'
import Home from './routes/Home.jsx'
import Navbar from './components/Navbar.jsx'
import Auth from './routes/Auth.jsx'
import { useAuth } from './contexts/AuthProvider.jsx'

function App() {
	const {currentUser} = useAuth();

	const socket = useSocket("http://localhost:3000/", {
		transports: ["websocket"],
		cors: {
			origin: "*"
		}
	})

	useEffect(() => {
		if (!socket) return

		socket.on("join", (event) => {
			console.log("connected: ", event.data)
		})

		return () => {
			socket.off("join")
		}

	}, [socket])


	return (
		<Router>
			<Navbar></Navbar>
			<div className="flex justify-center align-middle w-screen h-screen bg-primary-grey">
				<Routes>
					<Route path='/' Component={Home}></Route>
					<Route path='/auth' element={
						currentUser ? <Navigate to="/" /> : <Auth />
					}></Route>
					<Route path='/chess' element={
						currentUser ? <Chess /> : <Navigate to="/auth" />
					}></Route>
				</Routes>
			</div>
		</Router>
	  );
}

export default App
