import React, { useState, useEffect, useRef } from 'react'
import { movesSearchFunctions } from '../server/src/chess/utils/moves'
import { useSocket } from './hooks/useSocket'
import './App.css'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import Chess from './routes/chess.jsx'
import Home from './routes/Home.jsx'
import Navbar from './components/Navbar.jsx'
import Header from './components/Header.jsx'
import Auth from './routes/Auth.jsx'
import Profile from './routes/Profile.jsx'
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
			{/* <Header></Header> */}
			<Navbar></Navbar>
			<div className="flex justify-center align-middle w-screen h-screen bg-primary-grey">
				<Routes>
					<Route path='/' Component={Home}></Route>
					<Route path='/auth' element={
						currentUser ? <Navigate to="/" /> : <Auth />
					}></Route>
					<Route path='/profile' element={
						currentUser ? <Profile /> : <Navigate to="/auth" />
					}></Route>
					<Route path='/chess' element={
						currentUser ? <Chess /> : <Navigate to="/auth" />
					}></Route>
					<Route path='*' element={
						<h1>ERROR 404: PAGE NOT FOUND</h1>
					}></Route>
				</Routes>
			</div>
		</Router>
	  );
}

export default App
