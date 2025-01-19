import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthProvider";
import { useParams } from "react-router-dom";
import { useSocketContext } from "../contexts/SocketProvider";
import LoadingSpinner from "../components/LoadingSpinner";
import { validateMoves, commitMove, getPossibleMoves, isCheck, createBoard } from "../chess/chess";
import { GamePlayerHeader } from "../components/GamePlayerHeader";
import { GameWinner } from "../components/GameWinner";
import GameChat from "../components/GameChat";

export default function Chess() {
  const { id: gameId } = useParams();
  const { currentUser } = useAuth();
  const socket = useSocketContext();

  const [board, setBoard] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [canPlay, setCanPlay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [player, setPlayer] = useState({});
  const [opponent, setOpponent] = useState({});
  const [winner, setWinner] = useState("");

  const [simulatedIndex, setSimulatedIndex] = useState(-1);
  const [storedLiveBoard, setStoredLiveBoard] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    if (!socket) return;
    if (!gameId) return;
    // get game state
    socket.emit("game:loaded", gameId);

    setLoading(true);

    socket.on("game:update", (event) => {
      // go back to live if enemy moves
      setStoredLiveBoard([]);
      setSimulatedIndex(-1);
      setBoard(event.board);

      const team = event.w.uid == currentUser.uid ? "w" : "b";
      setCanPlay(event.player_turn == team);
      setLoading(false);

      const w = { uid: event.w.uid, displayName: event.w.name, color: "w" }
      const b = { uid: event.b.uid, displayName: event.b.name, color: "b" }

      setPlayer(team == "w" ? w : b);
      setOpponent(team == "w" ? b : w);
      setMoveHistory(event.move_history);

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

  const pieceToNotation = {
    "pawn": "",
    "knight": "N",
    "rook": "R",
    "bishop": "B",
    "queen": "Q",
    "king": "K"
  }

  const notationToPiece = {
    "N": "knight",
    "R": "rook",
    "B": "bishop",
    "Q": "queen",
    "K": "king"
  }

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  const attemptDrop = (piece, x, y) => {

    // if x and y exists in valid moves
    for (let move of validMoves) {
      if (move.x == x && move.y == y) {
        // commit move
        const newBoard = commitMove(heldPiece, move, board, false);

        // handle promotion
        if (heldPiece.piece.piece == "pawn" && (move.y == 7 || move.y == 0)) {
          setBoard(newBoard);
          setPromotionState({ x: x, y: y, from_x: heldPiece.position.x, from_y: heldPiece.position.y});
          return;
        }

        // translate move to chess double disambigous notation
        let notation = pieceToNotation[heldPiece.piece.piece];
        notation += files[heldPiece.position.x];
        notation += heldPiece.position.y + 1;
        if (move.type == "attack")
          notation += "x"
        notation += files[x];
        notation += y + 1;

        if (move.type == "castle") {
          notation = "o-o";
          if (x < 4) notation += "-o";
        }

        if (socket)
          socket.emit("game:endTurn", gameId, newBoard, notation);
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

    const heldPiece = { piece: piece, position: { x: x, y: y } };
    setHeldPiece(heldPiece);
  }

  const promotePawn = (piece) => {
    const newBoard = board;
    newBoard[promotionState.y][promotionState.x].piece = piece;
    setPromotionState(null);

    let notation = files[promotionState.from_x] + (promotionState.from_y + 1) + files[promotionState.x] + (promotionState.y + 1) + pieceToNotation[piece];

    if (socket)
      socket.emit("game:endTurn", gameId, newBoard, notation);
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

  const simulateBoardToMove = (moveIndex) => {
    const moves = moveHistory.slice(0, moveIndex + 1);
    const simulatedBoard = createBoard();
    let idx = 0;
    for (let move of moves) {
      // handle castle
      const color = idx % 2 == 0 ? "w" : "b";
      if (move == "o-o") {
        const y = color == "w" ? 7 : 0;
        simulatedBoard[y][6] = {piece: "king", color: color, moves: 1}
        simulatedBoard[y][5] = {piece: "rook", color: color, moves: 1}
        simulatedBoard[y][4] = {}
        simulatedBoard[y][7] = {}
        idx++;
        continue
      } else if (move == "o-o-o") {
        const y = color == "w" ? 7 : 0;
        simulatedBoard[y][2] = {piece: "king", color: color, moves: 1}
        simulatedBoard[y][3] = {piece: "rook", color: color, moves: 1}
        simulatedBoard[y][4] = {}
        simulatedBoard[y][0] = {}
        idx++;
        continue
      }

      // standard case
      move = move.replace('x', '');
      let piece = move[0];
      let pointer = 1;
      if (piece != piece.toUpperCase()) {
        piece = "pawn";
        pointer = 0;
      } else
        piece = notationToPiece[piece];

      let from_x = files.findIndex((file) => file == move[pointer]);
      let from_y = move[pointer + 1] - 1;
      let to_x = files.findIndex((file) => file == move[pointer + 2]);
      let to_y = move[pointer + 3] - 1;

      // handle promotion
      if (move[move.length - 1] != to_y + 1)
        piece = notationToPiece[move[move.length - 1]];


      simulatedBoard[from_y][from_x] = {};
      simulatedBoard[to_y][to_x] = {piece: piece, color: color};
      idx++;
    }
    setSimulatedIndex(moveIndex);
    
    if (storedLiveBoard.length == 0)
      setStoredLiveBoard(board);
    setBoard(simulatedBoard);
  }

  const backToLiveGame = () => {
    console.log(storedLiveBoard)
    if (storedLiveBoard != []) {
      setBoard(storedLiveBoard);
      setStoredLiveBoard([]);
      setSimulatedIndex(-1);
    }
  }


  return (
    <div className="flex flex-col md:flex-row items-center h-full gap-5">
      <div className="flex flex-col w-96 self-center bg-primary-dark h-[32rem] rounded-md border-[1px] border-neutral-black">
        <h1 className="text-center text-text-white text-2xl border-b-2 border-text-white p-2">
          Move History
        </h1>
        <div className="flex-grow overflow-y-scroll">
          <ul>
            {moveHistory.map((move, index) => (
              <li key={index}
                className={`flex flex-row text-text-white hover:brightness-125 bg-primary-dark ${simulatedIndex >= index ? "brightness-150" : ""}`}
                onClick={() => simulateBoardToMove(index)}
              >
                <p className="w-12 border-r-2 text-center">{index + 1}</p> <p className="w-full text-center">{move}</p>
              </li>
            ))}
          </ul>
        </div>
        <button
          className="rounded-b-md border-t-2 p-2 border-text-white
            text-text-white bg-accent-green disabled:bg-primary-dark"
          disabled={simulatedIndex < 0}
          onClick={() => backToLiveGame()}
        >
          {simulatedIndex >= 0 
          ? "Jump to live game"
          : "Live"
          }
        </button>
      </div>

      <div className="flex flex-col w-full h-full justify-center items-center self-center">
        <div className="items-center relative">
          {winner &&
            <GameWinner winner={winner} player={player} opponent={opponent} />
          }
          <GamePlayerHeader playerName={opponent.displayName} playerImg={"../../profile.png"} playerTurn={!canPlay} up={true} />
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
                  className={`flex relative justify-center aspect-square 
                  w-12 md:w-14 lg:w-20
                  items-center ${(x + y) % 2 == 0 ? "bg-[#D1A575]" : "bg-[#F7ECD9]"}
                  hover:brightness-150 hover:cursor-pointer 
                  ${player.color == "b" ? "rotate-180" : ""}`}
                  onClick={() => handleClickSquare(piece, x, y)}
                >
                  {piece.piece != undefined &&
                    <img 
                    className={`w-full ${(piece.piece == "king" && isCheck(piece.color, board)) ? "bg-secondary-redish rounded-full brightness-125" : ""}`} 
                    src={`${piece.color == "w" ? "/pieces/w_" + piece.piece + ".png" : "/pieces/b_" + piece.piece + ".png"}`}>
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
          <GamePlayerHeader playerName={player.displayName} playerImg={"../../profile.png"} playerTurn={canPlay} up={false} />
        </div>
      </div>

      <div className="w-96 self-center">
        <div className="">
          <GameChat opponent={opponent.uid} gameId={gameId} />
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
