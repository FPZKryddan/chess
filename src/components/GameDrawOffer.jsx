/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";
import LoadingDots from "./LoadingDots";
import { useSocketContext } from "../contexts/SocketProvider";
import { ToastProvider, useToast } from "../contexts/ToastProvider";

export const GameDrawOffer = ({gameId, opponent, close}) => {

    const {createToast} = useToast();
    const socket = useSocketContext();
    const navigate = useNavigate();

    useEffect(() => {
        if (!socket) return;

    }, [socket]);

    const handleAccept = () => {
        if (!socket) return;
        socket.emit("game:drawaccept", gameId);
        close();
    }

    const handleDecline = () => {
        if (!socket) return;
        socket.emit("game:drawdecline", opponent);
        close();
    }

    return (
        <div className="absolute flex flex-col w-1/2 rounded-md p-5
            top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-neutral-white shadow-xl">
            <div>
                <h1 className="text-center text-2xl font-bold">{opponent.displayName} offers a draw</h1>
            </div>
            <div className="flex flex-row gap-2 text-text-white">
                <button 
                    className={`p-2 rounded-md w-1/2 bg-accent-green`}
                    onClick={() => handleAccept()}>Accept</button>
                <button 
                className="p-2 rounded-md w-1/2 bg-secondary-redish hover:contrast-125" 
                onClick={() => handleDecline()}>Decline</button>
            </div>
        </div>
    )
}