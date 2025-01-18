/* eslint-disable react/prop-types */
import { useEffect, useState, useCallback, useRef } from "react";
import { useSocketContext } from "../contexts/SocketProvider";
import { HiMiniCheck } from "react-icons/hi2";
import { useAuth } from "../contexts/AuthProvider";

const GameChat = ({opponent, gameId}) => {
    const { currentUser } = useAuth();
    const socket = useSocketContext();
    const inputRef = useRef(null);

    const [inputMessage, setInputMessage] = useState("");
    const [messages, setMessages] = useState([])
    

    const handleSend = useCallback(() => {
        console.log(inputMessage);
        if (inputMessage.trim() !== "") {
            socket.emit("gamechat:send", {sender: currentUser.uid, message: inputMessage, reciever: opponent, gameId: gameId});
            setInputMessage("");
        }
    }, [currentUser.uid, gameId, inputMessage, opponent, socket])

    useEffect(() => {
        if (!socket) return;
        
        const handleKeyUp = (e) => {
            if (e.key === "Enter") {
                handleSend();
            }
        };
    
        socket.on("gamechat:update", (data) => {
            setMessages(data);
        })

        const inputElement = inputRef.current;
        if (inputElement)
            inputElement.addEventListener('keyup', handleKeyUp);


        return () => {
        if (inputElement)
            inputElement.removeEventListener('keyup', handleKeyUp);
        };

    }, [socket, handleSend])


    return (
        <div className="flex flex-col bg-primary-dark rounded-lg border-2 border-neutral-black">
            <div className="border-b-2 border-b-primary-grey p-2">
                <h1 className="text-center text-text-white text-2xl">Chat</h1>
            </div>
            <div className="h-[44rem] p-2">
                <ul className="flex flex-col gap-1 max-h-full overflow-y-auto w-full">
                    {messages.map((message, index) => (
                        <li 
                            className={`${message.sender == currentUser.uid ? "bg-accent-green" : "bg-secondary-brownish"}
                            ${message.sender == currentUser.uid ? "self-end" : "self-start"}
                            p-2 rounded-md max-w-[95%]`}
                            key={index}>
                            <p className="text-text-white text-wrap overflow-hidden">
                                {message.message}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="flex flex-row border-t-[1px] border-text-white">
                <input 
                    type="text"
                    id="inputMessage"
                    ref={inputRef}
                    className="p-2 bg-primary-dark w-4/5 rounded-bl-lg text-text-white" 
                    placeholder="Type message here!" 
                    value={inputMessage} 
                    onChange={(e) => setInputMessage(e.target.value)} />
                <button 
                    className="w-1/5 border-l-[1px] border-text-white bg-primary-dark brightness-125 rounded-br-lg
                    hover:brightness-150"
                    onClick={() => handleSend()}>
                    <HiMiniCheck 
                        className="w-full text-text-white size-6"/>
                </button>
            </div>
        </div>
    )
}

export default GameChat;