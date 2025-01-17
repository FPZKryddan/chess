/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";
import LoadingDots from "./LoadingDots";
import { useSocketContext } from "../contexts/SocketProvider";

export const GameWinner = ({winner, player, opponent}) => {
    const [remathRequestPending, setRematchRequestPending] = useState(false);
    const [rematchRequestRecieved, setRematchRequestRecieved] = useState(false);

    const socket = useSocketContext();
    const navigate = useNavigate();

    useEffect(() => {
        if (!socket) return;

        socket.on("rematch:challenge", (event) => {
            setRematchRequestRecieved(true);
        })

        return () => {
            socket.off("rematch:challenge");
        }

    }, [socket]);

    const handleRematch = () => {
        setRematchRequestPending(true);
        socket.emit("rematch:request", {player: player.uid, opponent: opponent.uid, confirmed: rematchRequestRecieved})
    }

    return (
        <div className="absolute flex flex-col w-1/2 rounded-md p-5
            top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-neutral-white shadow-xl">
            <div>
                <h1 className="text-center text-2xl font-bold">{winner == "w" ? "White" : "Black"} wins!</h1>
            </div>
            <div>
                {rematchRequestRecieved ? 
                <p className="text-center text-accent-green">Opponent wants to rematch!</p>
                :
                <p className="text-center">Play again? or give up!</p>
                }
            </div>
            <div className="flex flex-row gap-2">
                <button 
                    className={`p-2 rounded-md w-1/2 bg-accent-green ${remathRequestPending ? "contrast-50" : "hover:contrast-125"} ${rematchRequestRecieved ? "animate-pulse" : ""}`}
                    onClick={() => handleRematch()}>{remathRequestPending ? <LoadingDots size={20}/> : "Rematch"}</button>
                <button className="p-2 rounded-md w-1/2 bg-secondary-redish hover:contrast-125" onClick={() => navigate("/")}>Home</button>
            </div>
        </div>
    )
}