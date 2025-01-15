/* eslint-disable react/prop-types */
export const GameWinner = ({winner}) => {


    return (
        <div className="absolute flex flex-col w-1/2 rounded-md p-5
            top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-neutral-white shadow-xl">
            <div>
                <h1 className="text-center text-2xl font-bold">{winner == "w" ? "White" : "Black"} wins!</h1>
            </div>
            <div>
                <p className="text-center">sucks to suck</p>
            </div>
            <div className="flex flex-row gap-2">
                <button className="p-2 rounded-md w-1/2 bg-accent-green">Rematch?</button>
                <button className="p-2 rounded-md w-1/2 bg-secondary-redish">Home</button>
            </div>
        </div>
    )
}