import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthProvider";
import { useParams } from "react-router-dom";
import { useSocketContext } from "../contexts/SocketProvider";
import LoadingSpinner from "../components/LoadingSpinner";
import { validateMoves, commitMove, getPossibleMoves } from "../chess/chess";
import { GamePlayerHeader } from "../components/GamePlayerHeader";
import { GameWinner } from "../components/GameWinner";
import GameChat from "../components/GameChat";

export default function Chess() {
  const {id: gameId} = useParams();
  const {currentUser} = useAuth();
  const socket = useSocketContext();

  const [board, setBoard] = useState([]);
  const [canPlay, setCanPlay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [player, setPlayer] = useState({});
  const [opponent, setOpponent] = useState({}); 
  const [winner, setWinner] = useState("");

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
      const team = event.w.uid == currentUser.uid ? "w" : "b";
      setCanPlay(event.player_turn == team);
      setLoading(false);

      const w = {uid: event.w.uid, displayName: event.w.name, color: "w"}
      const b = {uid: event.b.uid, displayName: event.b.name, color: "b"}

      setPlayer(team == "w" ? w : b);
      setOpponent(team == "w" ? b : w);
      console.log(event);
      console.log(currentUser);
      
      if (event.winner != {})
        setWinner(event.winner);
    })

    socket.on("game:end", (event) => {
      setWinner(event.winner);
    })

    return () => {
      socket.off("game:update");
      socket.off("game:end");
    }

  }, [currentUser, socket, gameId])


  const [validMoves, setValidMoves] = useState([]);
  const [heldPiece, setHeldPiece] = useState({});
  const [promotionState, setPromotionState] = useState(null);

  const boardRefs = useRef(
    Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => React.createRef()),
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
      
        // handle promotion
        if (heldPiece.piece.piece == "pawn" && (move.y == 7 || move.y == 0)) {
          setBoard(newBoard);
          setPromotionState({x: x, y: y});
          return;
        }

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
    if (piece.color != player.color) return;

      const heldPiece = {piece: piece, position: {x: x, y: y}};
    setHeldPiece(heldPiece);
  }

  const promotePawn = (piece) => {
    console.log(promotionState);
    const newBoard = board;
    newBoard[promotionState.y][promotionState.x].piece = piece;
    console.log(newBoard[promotionState.y][promotionState.x]);
    setPromotionState(null);

    if (socket)
      socket.emit("game:endTurn", gameId, newBoard);
    setBoard(newBoard);
    setHeldPiece({});

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


  return (
    <div className="flex flex-row justify-evenly h-full">
      <div>

      </div>
      <div className="flex flex-col h-5/6 justify-evenly">
        <div className="h-5/6 aspect-square items-center relative">
          {winner &&
            <GameWinner winner={winner} player={player} opponent={opponent}/>
          }
          <GamePlayerHeader playerName={opponent.displayName} playerImg={"../../profile.png"} playerTurn={!canPlay} up={true}/>
          <div className={`grid grid-cols-8 grid-rows-8 bg-green-500 border-2 border-primary-dark 
              ${player.color == "b" ? "rotate-180" : ""}`}>
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
                  className={`flex relative justify-center aspect-square items-center ${(x + y) % 2 == 0 ? "bg-[#D1A575]" : "bg-[#F7ECD9]"}
                  hover:brightness-150 hover:cursor-pointer 
                  ${player.color == "b" ? "rotate-180" : ""}`}
                  onClick={() => handleClickSquare(piece, x, y)}
                  >
                  {/* <h1
                    className={`${piece.color == "w" ? "text-text-white" : "text-neutral-black"} font-bold font-cases`}
                    style={{ fontSize: `calc(5vw / 1.8)`,
                    textShadow: "0 0 1px black, 0 0 1px black, 0 0 1px black"
                    }}>
                    {fontMapping[piece.piece]}
                    </h1> */}
                  {piece.piece != undefined && 
                    <img className="" src={`${piece.color == "w" ? "/pieces/w_" + piece.piece + ".png" : "/pieces/b_" + piece.piece + ".png"}`}>
                    </img>
                  }

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
          <GamePlayerHeader playerName={player.displayName} playerImg={"../../profile.png"} playerTurn={canPlay} up={false}/>
        </div>
      </div>
          
      <div className="w-96 self-center">
          <div className="">
            <GameChat opponent={opponent.uid} gameId={gameId}/>
          </div>
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
    </div>
  );
}
