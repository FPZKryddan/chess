import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthProvider"
import { useSocketContext } from "../contexts/SocketProvider";
import LoadingSpinner from "../components/LoadingSpinner";
import { useNavigate } from "react-router-dom";


export const ChessLobby = () => {
    const {currentUser} = useAuth();
    const socket = useSocketContext();
    const [activeGames, setActiveGames] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!socket) return;
        if (!currentUser) return;

        setLoading(true);
        const url = "http://127.0.0.1:3000/games/" + currentUser.uid;
        const options = {
            method: "GET",
            headers: {
                "Content-Type": "Application/Json"
            }
        };
        fetch(url, options)
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            setActiveGames(data.data);
            setLoading(false);
        })
    }, [currentUser, socket])

    const handleClickGame = (gameId) => {
        navigate("/chess/" + gameId);
    }

    return (
        <>
            <div className="w-1/2 p-5 h-full">
                <h1 className="text-3xl font-semibold">Your active games</h1>
                <div className="grid grid-cols-3 gap-2">
                    {loading 
                        ? <div className="col-span-3 row-span-3">
                            <LoadingSpinner /> 
                        </div>
                    
                        : activeGames.length > 0 
                            ? activeGames.map((game, index) => (
                                <div key={index} className="rounded-md shadow-xl border-2 h-24 p-2 
                                    cursor-pointer hover:border-4"
                                    onClick={() => handleClickGame(game.gameId)}>
                                    <div className="flex flex-row gap-1">
                                        <h1 className="text-2xl font-bold">VS </h1>
                                        <p className="text-md font-semibold">{game.opponent}</p>
                                    </div>
                                    <div className=""> 
                                        <p className={`${game.toPlay ? "text-accent-green" : "text-secondary-redish"} font-semibold`}>{game.toPlay ? "Your Turn" : "Oppontents Turn"}</p>
                                        <p className="text-sm">ID: {game.gameId}</p>
                                    </div>
                                </div>
                            ))
                            :    
                            <p className="col-span-5">You don't have any active games</p>
                        
                    }
                </div>
            </div>
        </>
    )
}