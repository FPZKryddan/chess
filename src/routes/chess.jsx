import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthProvider";
import { useSocket } from "../hooks/useSocket";
import { useParams } from "react-router-dom";
import { useSocketContext } from "../contexts/SocketProvider";
import LoadingSpinner from "../components/LoadingSpinner";
import { validateMoves, commitMove, getPossibleMoves } from "../chess/chess";

export default function chess() {
  const {id: gameId} = useParams();
  const {currentUser} = useAuth();
  const socket = useSocketContext();

  const [board, setBoard] = useState([]);
  const [canPlay, setCanPlay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playerColor, setPlayerColor] = useState(""); 

  useEffect(() => {
    if (!currentUser) return;
    if (!socket) return;
    if (!gameId) return;
    // get game state
    socket.emit("game:loaded", gameId);

    setLoading(true);
    
    socket.on("game:update", (event) => {
      console.log("UPDATED")
      setBoard(event.board);
      const team = event.w == currentUser.uid ? "w" : "b";
      setCanPlay(event.player_turn == team);
      setLoading(false);
      setPlayerColor(team);
      console.log(event);
    })

    return () => {
      socket.off("game:update");
    }

  }, [currentUser, socket, gameId])

  const BOARD_SIZE = 8;
  const [turn, setTurn] = useState("w");

  const [validMoves, setValidMoves] = useState([]);
  const [heldPiece, setHeldPiece] = useState({});
  const [promotionState, setPromotionState] = useState(null);

  const boardRefs = useRef(
    Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => React.createRef()),
    ),
  );

  const handleClickSquare = (piece, x, y) => {
    if (!canPlay) return;
    if ("piece" in heldPiece) {
      // if holding a piece attempt to drop it 
      if (attemptDrop(piece, x, y) == -1) {
        // if drop failed
        // attempt pickup
        attemptPickUp(piece, x, y);
      }

    } else {
      attemptPickUp(piece, x, y)
    }
  }

  const attemptDrop = (piece, x, y) => {

    // if x and y exists in valid moves
    for (let move of validMoves) {
      if (move.x == x && move.y == y){
        // commit move
        const newBoard = commitMove(heldPiece, move, board, false);
        if (socket)
          socket.emit("game:endTurn", gameId, newBoard);
        setBoard(newBoard);
        setHeldPiece({});
        return;
      }
    }

    return -1;
  }

  const attemptPickUp = (piece, x, y) => {

    // check if piece
    if (Object.keys(piece).length <= 0) {
      setHeldPiece({});
      return;
    };
    // check if correct team
    if (piece.color != playerColor) return;

      const heldPiece = {piece: piece, position: {x: x, y: y}};
    setHeldPiece(heldPiece);
  }

  useEffect(() => {
    if (!("piece" in heldPiece)) {
      setValidMoves([]);
      return;
    }

    // get moves held piece can do and display them
    const possibleMoves = getPossibleMoves(heldPiece.piece, heldPiece.position, board);
    const validatedMoves = validateMoves(heldPiece, possibleMoves, board);
    console.log(validatedMoves)
    setValidMoves(validatedMoves);
  }, [heldPiece])

  const initMove = (piece, x, y) => {
    // if not holding a piece, pick it up
    if (Object.keys(heldPiece).length == 0) {
      if (Object.keys(piece).length == 0)
        // if clicked a empty square return
        return;
      if (piece.color != turn)
        // if clicked piece is wrong team return
        return;

      const selection = {};
      selection.piece = piece.piece;
      selection.color = piece.color;
      if ("moves" in piece) selection.moves = piece.moves;
      selection.position = { x, y };
      setHeldPiece(selection);

      const moves = getPossibleMoves(selection, selection.position, board);
      const validatedMoves = validateMoves(selection, moves);
      if (validatedMoves.length == 0) setHeldPiece({});
      setValidMoves(validatedMoves);
    } else {
      //
      // check if click cords are in validMoves positions
      // Commit move
      const attemptedMove = validMoves.filter(
        (move) => move.x === x && move.y === y,
      );
      if (attemptedMove.length > 0) {
        // castling
        if (attemptedMove[0].type == "castle") {
          const direction = attemptedMove[0].x < heldPiece.position.x ? -1 : 1;
          const rook = {
            piece: "rook",
            color: heldPiece.color,
            position: { x: direction < 0 ? 0 : 7, y: attemptedMove[0].y },
          };
          commitMove(
            rook,
            {
              x: heldPiece.position.x + direction,
              y: rook.position.y,
              type: "castle",
            },
            board,
            false,
          );
          commitMove(
            heldPiece,
            {
              x: heldPiece.position.x + direction * 2,
              y: heldPiece.position.y,
              type: "castle",
            },
            board,
            false,
          );
        } else commitMove(heldPiece, attemptedMove[0], board, false);
      }
      setHeldPiece({});
      setValidMoves([]);
    }
  };

  return (
    <>
      <div className="grid grid-cols-8 grid-rows-8 w-1/3 aspect-square m-auto bg-green-500">
        {loading &&
          <div className="col-span-8 row-span-8 bg-neutral-white opacity-50">
            <LoadingSpinner />
          </div>
        }
        {board.map((row, y) =>
          row.map((piece, x) => (
            <div
              key={`${x}-${y}`}
              ref={boardRefs.current[x][y]}
              className={`flex relative justify-center items-center ${(x + y) % 2 == 0 ? "bg-[#769656]" : "bg-[#eeeed2]"}
                            hover:brightness-150 hover:cursor-pointer`}
              onClick={() => handleClickSquare(piece, x, y)}
            >
              <h1
                className={`${piece.color == "w" ? "text-text-white" : "text-neutral-black"} font-bold`}
              >
                {piece.piece}
              </h1>

              <div
                className={
                  `absolute top-0 left-0 w-full h-full pointer-events-none ` +
                  (validMoves.some(
                    (move) =>
                      move.x === x &&
                      move.y === y &&
                      (move.type === "attack" || move.type === "enpassant"),
                  )
                    ? "bg-secondary-redish opacity-70"
                    : "") +
                  (validMoves.some(
                    (move) =>
                      move.x === x && move.y === y && move.type === "move",
                  )
                    ? "bg-accent-blue opacity-70"
                    : "") +
                  (validMoves.some(
                    (move) =>
                      move.x === x && move.y === y && move.type === "castle",
                  )
                    ? "bg-accent-green opacity-70"
                    : "")
                }
              ></div>
            </div>
          )),
        )}
      </div>
      {promotionState && (
        <div className="absolute flex flex-row bg-slate-600">
          <button
            className="aspect-square w-16 text-white font-bold hover:bg-gray-700"
            onClick={() => promotePawn("rook")}
          >
            Rook
          </button>
          <button
            className="aspect-square w-16 text-white font-bold hover:bg-gray-700"
            onClick={() => promotePawn("knight")}
          >
            Knight
          </button>
          <button
            className="aspect-square w-16 text-white font-bold hover:bg-gray-700"
            onClick={() => promotePawn("bishop")}
          >
            Bishop
          </button>
          <button
            className="aspect-square w-16 text-white font-bold hover:bg-gray-700"
            onClick={() => promotePawn("queen")}
          >
            Queen
          </button>
        </div>
      )}
    </>
  );
}
