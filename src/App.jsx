import React, { useState, useRef } from 'react'
import { getPossibleMovesRook } from './chess/pieces/Rook'
import './App.css'

function App() {

	const BOARD_SIZE = 8

	const [board, setBoard] = useState([
		[{piece: "rook", color: "b"}, {piece: "knight", color: "b"}, {piece: "bishop", color: "b"}, {piece: "queen", color: "b"}, 
			{piece: "king", color: "b"}, {piece: "bishop", color: "b"}, {piece: "knight", color: "b"}, {piece: "rook", color: "b"}],
		[{piece: "pawn", color: "b"}, {piece: "pawn", color: "b"}, {piece: "pawn", color: "b"}, {piece: "pawn", color: "b"},
			 {piece: "pawn", color: "b"}, {piece: "pawn", color: "b"}, {piece: "pawn", color: "b"}, {piece: "pawn", color: "b"}],
		[{}, {}, {}, {}, {},{}, {}, {}],
		[{}, {}, {}, {}, {},{}, {}, {}],
		[{}, {}, {}, {}, {},{}, {}, {}],
		[{}, {}, {}, {}, {},{}, {}, {}],
		[{piece: "pawn", color: "w"}, {piece: "pawn", color: "w"}, {piece: "pawn", color: "w"}, {piece: "pawn", color: "w"}, 
			{piece: "pawn", color: "w"}, {piece: "pawn", color: "w"}, {piece: "pawn", color: "w"}, {piece: "pawn", color: "w"}],
		[{piece: "rook", color: "w"}, {piece: "knight", color: "w"}, {piece: "bishop", color: "w"}, {piece: "king", color: "w"},
			 {piece: "queen", color: "w"}, {piece: "bishop", color: "w"}, {piece: "knight", color: "w"}, {piece: "rook", color: "w"}],
	])

	const boardRefs = useRef(
		Array.from({ length: BOARD_SIZE }, () =>
		  Array.from({ length: BOARD_SIZE }, () => React.createRef())
		)
	);

	const moveRules = {
		rook: "straight",
		knight: "L",
		bishop: "diagonal",
		queen: "omni",
		king: ""

	}

	const showPossibleMoves = (piece, x, y) => {
		const moves = getPossibleMovesRook({x: x, y: y}, board)
		console.log("x: " + x + " y: " + y)
		moves.forEach(move => {
			const cell = boardRefs.current[move.x][move.y].current;
			cell.style.backgroundColor = "red";
		});
	}

	return (
		<div className="flex justify-center align-middle w-screen h-screen bg-black">
		  <div className="grid grid-cols-8 grid-rows-8 w-1/3 aspect-square m-auto bg-green-500">
			{board.map((row, y) =>
			  row.map((piece, x) => (
				<div key={`${x}-${y}`} ref={boardRefs.current[x][y]} className={`flex justify-center items-center ${(x + y)% 2 == 0 ? "bg-[#769656]" : "bg-[#eeeed2]"}
					hover:brightness-150 hover:cursor-pointer`} onClick={() => showPossibleMoves(piece, x, y)}>
				  <h1 className={`${piece.color == "w" ? "text-white" : "text-black"} font-bold`} >{piece.piece}</h1>
				</div>
			  ))
			)}
		  </div>
		</div>
	  );
}

export default App
