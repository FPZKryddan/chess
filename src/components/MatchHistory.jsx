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
                <div className="w-1/2 h-full bg-accent-blue mx-auto">
                    {matchHistoryData ? (
                        <ul className="w-full max-h-full p-2 overflow-auto text-text-white">
                            {matchHistoryData.map((match, index) => {
                                const opponent = match.w.uid === uid ? match.b : match.w
                                return (
                                    <li
                                        key={index}
                                        className="flex flex-row gap-5 items-center justify-evenly text-center align-baseline"
                                    >
                                        <div className="w-full flex flex-row gap-5 p-2">
                                            <h1 className="">VS {opponent.name}</h1>
                                            <p className="">{match.winner == "t" ? "Tie" : match.winner.uid == opponent.uid ? "Defeat" : "Victory"}</p>
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