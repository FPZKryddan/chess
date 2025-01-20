/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";

const MatchHistory = ({ uid }) => {
    const [matchHistoryData, setMatchHistoryData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log("USER:" + uid)
        if (!uid) return;

        const url = "http://localhost:3000/user/history/" + uid
        const options = {
            method: "GET",
            headers: {
                "Content-Type": "Application/Json"
            }
        }
        fetch(url, options)
            .then((response) => response.json())
            .then((matchHistory) => {
                console.log(matchHistory.matchHistory)
                setMatchHistoryData(matchHistory.matchHistory);
                setIsLoading(false);
            })
    }, []);

    return (
        <>
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <div className="w-full md:w-1/2 h-ful mx-auto">
                    {matchHistoryData ? (
                        <ul className="w-full max-h-full p-2 overflow-auto text-neutral-black">
                            {matchHistoryData.map((match, index) => {
                                const opponent = match.w.uid === uid ? match.b : match.w
                                return (
                                    <li
                                        key={index}
                                        className="flex flex-row gap-5 items-center justify-evenly text-center align-baseline"
                                    >
                                        <div className="w-full flex flex-row gap-5 p-2">
                                            <h1 className="text-lg self-center"><span className="text-xl font-extrabold">VS</span> {opponent.name}</h1>
                                            <p className={`
                                                ${match.winner.uid == opponent.uid ? "text-secondary-redish" : ""}
                                                ${match.winner.uid != opponent.uid ? "text-accent-green" : ""}
                                                ${match.winner == "t" ? "text-neutral-black" : ""} 
                                                font-bold self-center w-24`}>
                                                {match.winner == "t" ? "Tie" : match.winner.uid == opponent.uid ? "Defeat" : "Victory"}
                                            </p>
                                            <p className="self-center flex-grow">{match.last_updated}</p>
                                            <button
                                                disabled={true}
                                                className="p-2 px-4 rounded-md bg-accent-green text-text-white hover:brightness-125 disabled:brightness-75 drop-shadow-xl"
                                                >
                                                Replay
                                            </button>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    ) : (
                        <h1 className="text-center">You havent played any games yet!</h1>
                    )}
                </div>
            )}
        </>
    );
};


export default MatchHistory;