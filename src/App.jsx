import React, { useState, useEffect, useRef } from 'react'
import { getPossibleMovesRook } from './chess/pieces/Rook'
import { movesSearchFunctions } from './chess/utils/moves'
import './App.css'

function App() {

	const BOARD_SIZE = 8
	const [turn, setTurn] = useState("w")

	const [board, setBoard] = useState([
		[{piece: "rook", color: "b"}, {piece: "knight", color: "b"}, {piece: "bishop", color: "b"}, {piece: "queen", color: "b"}, 
			{piece: "king", color: "b"}, {piece: "bishop", color: "b"}, {piece: "knight", color: "b"}, {piece: "rook", color: "b"}],
		[{piece: "pawn", color: "b"}, {piece: "pawn", color: "b"}, {piece: "pawn", color: "b"}, {piece: "pawn", color: "b"},
			 {piece: "pawn", color: "b"}, {piece: "pawn", color: "b"}, {piece: "pawn", color: "b"}, {piece: "pawn", color: "b"}],
		[{}, {}, {}, {}, {piece: "pawn", color: "b"},{}, {}, {}],
		[{}, {}, {}, {piece: "pawn", color: "w"}, {},{}, {}, {}],
		[{}, {}, {}, {}, {},{}, {}, {}],
		[{}, {}, {}, {}, {},{}, {}, {}],
		[{piece: "pawn", color: "w"}, {piece: "pawn", color: "w"}, {piece: "pawn", color: "w"}, {piece: "pawn", color: "w"}, 
			{piece: "pawn", color: "w"}, {piece: "pawn", color: "w"}, {piece: "pawn", color: "w"}, {piece: "pawn", color: "w"}],
		[{piece: "rook", color: "w"}, {piece: "knight", color: "w"}, {piece: "bishop", color: "w"}, {piece: "king", color: "w"},
			 {piece: "queen", color: "w"}, {piece: "bishop", color: "w"}, {piece: "knight", color: "w"}, {piece: "rook", color: "w"}],
	])
	const [validMoves, setValidMoves] = useState([]);
	const [heldPiece, setHeldPiece] = useState({});

	const boardRefs = useRef(
		Array.from({ length: BOARD_SIZE }, () =>
		  Array.from({ length: BOARD_SIZE }, () => React.createRef())
		)
	);


	const initMove = (piece, x, y) => {
		// if not holding a piece, pick it up
		if (Object.keys(heldPiece).length == 0) {
			if (Object.keys(piece).length == 0) // if clicked a empty square return
				return
			if (piece.color != turn) // if clicked piece is wrong team return
				return

			const selection = {}
			selection.piece = piece.piece
			selection.color = piece.color
			selection.position = {x, y}
			setHeldPiece(selection)

			const moves = getPossibleMoves(selection, selection.position, board)
			const validatedMoves = validateMoves(selection, moves)
			if (validatedMoves.length == 0)
				setHeldPiece({})
			setValidMoves(validatedMoves)
		} else { //
			// check if click cords are in validMoves positions
			// Commit move
			const validClick = validMoves.some((move) => move.x === x && move.y === y)
			if (validClick) {
				commitMove(heldPiece, {x, y}, board, false)
				setHeldPiece({})
				setValidMoves([])
			} else{
				setHeldPiece({})
				setValidMoves([])
			}
		}


	}

	const getPossibleMoves = (piece, position, gameBoard) => {
		const { x, y } = position
		const moveSearchFunction = movesSearchFunctions[piece.piece]
		const moves = moveSearchFunction({x: x, y: y}, gameBoard)
		return moves
	}

	const validateMoves = (selectedPiece, moves) => {
		let validatedMoves = []
		moves.forEach(move => {
			if (isValidMove(selectedPiece, move)){
				validatedMoves = validatedMoves.concat([move])
			}
		});
		return validatedMoves
	}

	const isValidMove = (selectedPiece, move) => {
		// invalid if own king gets checked
		// create temp board and simulate move made
		const tempBoard = structuredClone(board)
		const position = {x: move.x, y: move.y}
		commitMove(selectedPiece, position, tempBoard, true)
		if (isCheck(turn, tempBoard)) 
			return false
		return true
	}

	const commitMove = (selectedPiece, position, gameBoard, simulated) => {
		const { x: oldX, y: oldY} = selectedPiece.position
		const { x: newX, y: newY } = position
		gameBoard[oldY][oldX] = {}
		gameBoard[newY][newX] = {piece: selectedPiece.piece, color: selectedPiece.color}
		if (!simulated) {
			setBoard(gameBoard)
			// promotion
			if (selectedPiece.piece == "pawn")
				if (newY == 7 || newY == 0) {
					// handle promotion
				}
			
			// end turn
			if (turn == "w") setTurn("b")
			else setTurn("w")
		}
	}

	const getKingPosition = (team, gameBoard) => {
		console.log(gameBoard)
		for (let y = 0; y < 8; y++) {
			for (let x = 0; x < 8; x++) {
				const piece = gameBoard[y][x]
				// if not a piece, ignore
				if (Object.keys(piece).length == 0)
					continue
				console.log("piece: " + piece.piece + " color: " + piece.color)
				if (piece.piece == "king" && piece.color == team)
					return {x: x, y: y}
			}
		}
		return false
	}

	const isCheck = (team, gameBoard) => {
		const kingPos = getKingPosition(team, gameBoard)
		if (kingPos === false)
			return true
		console.log(kingPos)

		let possibleKingAttack = false

		for (let y = 0; y < 8; y++) {
			for (let x = 0; x < 8; x++) {
				const piece = gameBoard[y][x]
				// if not a piece, ignore
				if (Object.keys(piece).length == 0)
					continue
	
				// if enemy piece check if it can attack king
				if (piece.color != team){
					const moves = getPossibleMoves(piece, {x, y}, gameBoard)
					moves.forEach(move => {
						if (move.x == kingPos.x && move.y == kingPos.y) {
							possibleKingAttack = true
							return true
						}
					});
				}
			}
		}
		if (possibleKingAttack)
			return true
		return false
	}

	useEffect(() => {
		console.log("Valid moves:", validMoves);
	}, [validMoves]);

	return (
		<div className="flex justify-center align-middle w-screen h-screen bg-black">
			<div className="grid grid-cols-8 grid-rows-8 w-1/3 aspect-square m-auto bg-green-500">
				{board.map((row, y) =>
					row.map((piece, x) => (
						<div key={`${x}-${y}`} ref={boardRefs.current[x][y]} className={`flex relative justify-center items-center ${(x + y)% 2 == 0 ? "bg-[#769656]" : "bg-[#eeeed2]"}
							hover:brightness-150 hover:cursor-pointer`} onClick={() => initMove(piece, x, y)}>
							<h1 className={`${piece.color == "w" ? "text-white" : "text-black"} font-bold`} >{piece.piece}</h1>
							
							<div className={`absolute top-0 left-0 w-full h-full pointer-events-none ` 
								+ (validMoves.some((move) => move.x === x && move.y === y && move.type === "attack") ? "bg-red-400 opacity-70" : "")
								+ (validMoves.some((move) => move.x === x && move.y === y && move.type === "move") ? "bg-slate-200 opacity-70" : "")}></div>
						</div>
					))
				)}
			</div>
		</div>
	  );
}

export default App
