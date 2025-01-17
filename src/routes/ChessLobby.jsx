import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthProvider"
import { useSocketContext } from "../contexts/SocketProvider";
import LoadingSpinner from "../components/LoadingSpinner";
import LoadingDots from "../components/LoadingDots";
import { useNavigate } from "react-router-dom";


export const ChessLobby = () => {
    const { currentUser } = useAuth();
    const socket = useSocketContext();
    const navigate = useNavigate();

    const [activeGames, setActiveGames] = useState([]);
    const [gamesLoading, setGamesLoading] = useState(false);
    const [queueCount, setQueueCount] = useState(0);
    const [queueStatus, setQueueStatus] = useState(false);

    useEffect(() => {
        if (!socket) return;
        if (!currentUser) return;

        setGamesLoading(true);
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
                setGamesLoading(false);
            })

        fetch("http://localhost:3000/queue/" + currentUser.uid, options)
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                setQueueCount(data.queue_count);
                setQueueStatus(data.queue_status);
            })
    }, [currentUser, socket])

    const handleClickGame = (gameId) => {
        navigate("/chess/" + gameId);
    }

    const handleFindGame = () => {
        if (!currentUser) return;

        const url = "http://localhost:3000/queue"
        const body = JSON.stringify({
            uid: currentUser.uid
        });
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "Application/Json"
            },
            body: body
        }
        console.log(options);
        fetch(url, options)
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                setQueueCount(queueCount + 1);
                setQueueStatus(true);
            })
    }

    const handleCancelQueue = () => {
        if (!currentUser) return;

        const url = "http://localhost:3000/queue/cancel"
        const body = JSON.stringify({
            uid: currentUser.uid
        });
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "Application/Json"
            },
            body: body
        }
        console.log(options);
        fetch(url, options)
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                setQueueCount(queueCount - 1);
                setQueueStatus(false);
            })
    }

    return (
        <>
            <div className="w-1/2 p-5 h-full mx-auto flex flex-col gap-2">
                <p className="text-center">There are {queueCount} {queueCount != 1 ? "players" : "player"} in queue!</p>
                {queueStatus 
                ?
                    <div className="text-center">
                        <p>Searching for game!</p>
                        <LoadingDots />
                        <button
                            className="rounded-md p-3 bg-secondary-redish text-text-white text-lg w-full hover:contrast-125"
                            onClick={() => handleCancelQueue()}>
                            Cancel Queue!
                        </button>
                    </div>
                :
                    <button
                        className="rounded-md p-3 bg-accent-green text-text-white text-lg w-full hover:contrast-125"
                        onClick={() => handleFindGame()}>
                        Find a game
                    </button>
                }
                <hr></hr>
                <h1 className="text-3xl font-semibold">Your active games</h1>
                <div className="grid grid-cols-3 gap-2">
                    {gamesLoading
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
                            <p className="col-span-5">You dont have any active games</p>

                    }
                </div>
            </div>
        </>
    )
}