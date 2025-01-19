

export const GamePlayerHeader = ({playerName, playerImg, playerTurn, up}) => {


    return (
        <div className={`flex flex-row w-full sm:w-1/2 md:w-1/3 bg-primary-dark text-text-white text-xl p-2 gap-2 border-4
            ${up ? "rounded-t-xl" : "rounded-b-xl"} 
            ${playerTurn ? 
            !up ? "border-accent-green animate-pulse" : "border-[#FF5555] animate-pulse" : "border-primary-dark"}`}>
          <img className="w-8 aspect-square rounded-full" src={playerImg}></img>
          <h1>{playerName}</h1>
        </div>
    )
}