import React, { useState, useEffect, useRef } from 'react'
import { movesSearchFunctions } from './chess/utils/moves'
import { useSocket } from './hooks/useSocket'
import './App.css'

function App() {

	const socket = useSocket("http://localhost:3000/", {
		transports: ["websocket"],
		cors: {
			origin: "*"
		}
	})

	useEffect(() => {
		if (!socket) return

		socket.on("join", (event) => {
			console.log("connected: ", event.data)
		})

	}, [socket])

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
		[{piece: "rook", color: "w"}, {}, {}, {piece: "king", color: "w"},
			 {piece: "queen", color: "w"}, {piece: "bishop", color: "w"}, {piece: "knight", color: "w"}, {piece: "rook", color: "w"}],
	])
	const [validMoves, setValidMoves] = useState([]);
	const [heldPiece, setHeldPiece] = useState({});
	const [promotionState, setPromotionState] = useState(null);
	const [enpassantPiece, setEnpassantPiece] = useState(null);

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
			if ('moves' in piece)
				selection.moves = piece.moves
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
			const attemptedMove = validMoves.filter((move) => move.x === x && move.y === y)
			if (attemptedMove.length > 0) {
				// castling
				if (attemptedMove[0].type == "castle") {
					const direction = (attemptedMove[0].x < heldPiece.position.x) ? -1 : 1
					const rook = {piece: "rook", color: heldPiece.color, position: {x: (direction < 0) ? 0 : 7, y: attemptedMove[0].y}}
					commitMove(rook, {x: heldPiece.position.x + direction, y: rook.position.y, type: "castle"}, board, false)
					commitMove(heldPiece, {x: heldPiece.position.x + direction * 2, y: heldPiece.position.y, type: "castle"}, board, false)
				} else 
					commitMove(heldPiece, attemptedMove[0], board, false)
			} 
			setHeldPiece({})
			setValidMoves([])
		}


	}

	const getPossibleMoves = (piece, position, gameBoard) => {
		const { x, y } = position
		const moveSearchFunction = movesSearchFunctions[piece.piece]
		let moves = moveSearchFunction({x: x, y: y}, gameBoard)
		if (piece.piece != "king")
			moves = moves.filter((move) => move.type != "castle")
		return moves
	}

	const validateMoves = (selectedPiece, moves) => {
		let validatedMoves = []
		moves.forEach(move => {
			// castling
			if (move.type == "castle") {
				// is valid if the two steps king takes are not checked by enemy
				const direction = move.x == 0 ? -1 : 1
				const step1 = {x: selectedPiece.position.x + direction, y: selectedPiece.position.y, type: move.type}
				const step2 = {x: selectedPiece.position.x + direction * 2, y: selectedPiece.position.y, type: move.type}

				if (!isValidMove(selectedPiece, step1)) return
				if (!isValidMove(selectedPiece, step2)) return
				
				// add valid moves from step2 -> rook
				for (let x = step2.x; (x >= 0 && x <= 7); x += direction) {
					validatedMoves = validatedMoves.concat([{x: x, y: step2.y, type: move.type}])
				}
			} else if (isValidMove(selectedPiece, move)){
				validatedMoves = validatedMoves.concat([move])
			}
		});
		return validatedMoves
	}

	const isValidMove = (selectedPiece, move) => {
		// invalid if own king gets checked
		// create temp board and simulate move made
		const tempBoard = structuredClone(board)
		commitMove(selectedPiece, move, tempBoard, true)
		if (isCheck(turn, tempBoard)) 
			return false
		return true
	}

	const commitMove = (selectedPiece, move, gameBoard, simulated) => {
		const { x: oldX, y: oldY} = selectedPiece.position
		const { x: newX, y: newY } = move
		const newPiece = {piece: selectedPiece.piece, color: selectedPiece.color, moves: (selectedPiece.moves || 0) + 1}

		// if enpassant attack
		if (move.type == "enpassant") 
			gameBoard[enpassantPiece.y][enpassantPiece.x] = {}
		
		gameBoard[oldY][oldX] = {}
		gameBoard[newY][newX] = newPiece
		if (!simulated) {
			// en passant move
			if (selectedPiece.piece == "pawn" && Math.abs(newY - oldY) == 2){ 
				gameBoard[newY][newX] = {...newPiece, enpassant: true}

				// remove old enpassant piece if exists on board
				if (enpassantPiece) {
					const oldEnpassantPiece = gameBoard[enpassantPiece.y][enpassantPiece.x]
					gameBoard[enpassantPiece.y][enpassantPiece.x] = {piece: oldEnpassantPiece.piece, color: oldEnpassantPiece.color, moves: oldEnpassantPiece.moves}
				}

				setEnpassantPiece({x: newX, y: newY})
			} else if (enpassantPiece) {
				const oldEnpassantPiece = gameBoard[enpassantPiece.y][enpassantPiece.x]
				if (Object.keys(oldEnpassantPiece) > 0)
					gameBoard[enpassantPiece.y][enpassantPiece.x] = {piece: oldEnpassantPiece.piece, color: oldEnpassantPiece.color, moves: oldEnpassantPiece.moves}
				setEnpassantPiece(null)
			}
			
			setBoard(gameBoard)

			// check checkmate
			if (isCheckmate(turn == "w" ? "b" : "w", gameBoard)) {
				console.log("checkmate")
			}
			
			// promotion
			if (selectedPiece.piece == "pawn" && (newY == 7 || newY == 0)) {
				setPromotionState({x: newX, y: newY})
				return // don't end turn until promotion state is off
			}
			
			// end turn
			endTurn()
		}
	}

	const getKingPosition = (team, gameBoard) => {
		for (let y = 0; y < 8; y++) {
			for (let x = 0; x < 8; x++) {
				const piece = gameBoard[y][x]
				// if not a piece, ignore
				if (Object.keys(piece).length == 0)
					continue
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

	const isCheckmate = (team, gameBoard) => {
		// check if check is blockable
		// loop through all of checked teams pieces and 
		if (!isCheck(team, gameBoard))
			return false

		for (let y = 0; y < BOARD_SIZE; y++) {
			for (let x = 0; x < BOARD_SIZE; x++) {
				const piece = gameBoard[y][x];
				if (Object.keys(piece).length === 0 || piece.color !== team) 
					continue;

				const possibleMoves = getPossibleMoves(piece, { x, y }, gameBoard)

				for(let move of possibleMoves) {
					const tempBoard = structuredClone(gameBoard)
					commitMove({piece: piece.piece, color: piece.color, position: {x, y }}, move, tempBoard, true)
					if (!isCheck(team, gameBoard))
						return false
				}

			}
		}
		return true
	}

	const promotePawn = (promotionPiece) => {
		if (promotionState) {
			const tempBoard = structuredClone(board)
			tempBoard[promotionState.y][promotionState.x] = {piece: promotionPiece, color: turn} 
			setBoard(tempBoard)
			setPromotionState(null)
			endTurn()
		}
	}

	const endTurn = () => {
		if (turn == "w") setTurn("b")
			else setTurn("w")
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
								+ (validMoves.some((move) => move.x === x && move.y === y 
								&& (move.type === "attack" || move.type === "enpassant")) ? "bg-red-400 opacity-70" : "")
								+ (validMoves.some((move) => move.x === x && move.y === y && move.type === "move") ? "bg-blue-400 opacity-70" : "")
								+ (validMoves.some((move) => move.x === x && move.y === y && move.type === "castle") ? "bg-green-400 opacity-70" : "")}></div>

						</div>
					))
				)}
			</div>
			{promotionState &&
				<div className="absolute flex flex-row bg-slate-600">
					<button className='aspect-square w-16 text-white font-bold hover:bg-gray-700' onClick={() => promotePawn("rook")}>Rook</button>
					<button className='aspect-square w-16 text-white font-bold hover:bg-gray-700' onClick={() => promotePawn("knight")}>Knight</button>
					<button className='aspect-square w-16 text-white font-bold hover:bg-gray-700' onClick={() => promotePawn("bishop")}>Bishop</button>
					<button className='aspect-square w-16 text-white font-bold hover:bg-gray-700' onClick={() => promotePawn("queen")}>Queen</button>

				</div>
			}
		</div>
	  );
}

export default App
