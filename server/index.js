require("dotenv").config();
const express = require("express");
const cors = require("cors");
const process = require("process");
const http = require("http");
const { Server } = require("socket.io");
const { auth } = require("./src/firebase.js");
const { addUserToDatabase, getFriendsFromUID, getFriendStatus,
  getUserByUID, getMatchHistoryByUID, 
  createChallengeRequest, acceptChallengeRequest, 
  denyChallengeRequest, createGameInstanceFromChallenge,
  createGameInstance, getGameInstance, 
  updateGameInstance, getUsersActiveGames,
  setWinnerGameInstance, createFriendRequest,
  acceptFriendRequest, denyFriendRequest,
  joinQueue, leaveQueue, checkQueueStatus,
  sendMessageToGameChat, getMessagesFromGameChat} = require("./src/db.js");
const {restructureBoard, isCheckmate} = require('./src/chess/chess.js');
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const io = new Server(server);

let activeClients = []

function findSidFromUid(uid) {
  for (var sid in activeClients) {
    if (activeClients[sid] == uid)
      return sid
  }
  return -1;
}

app.get("/", (req, res) => {
  res.status(200).send("<h1>HELLO</h1>");
});

app.get("/games/:uid", async (req, res) => {
  const uid = req.params.uid;
  const games = await getUsersActiveGames(uid);
  res.status(200).send({data: games});
})

app.get("/friends/:uid", async (req, res) => {
  const uid = req.params.uid;
  const friends = await getFriendsFromUID(uid);

  res.status(200).send({ data: friends });
});

app.get("/friend/:uid1/:uid2", async (req, res) => {
  const friendStatus = await getFriendStatus(req.params.uid1, req.params.uid2);

  if (!friendStatus) {
    res.status(200).send({status: null});
  } else {
    res.status(200).send({status: friendStatus});
  }
})

app.get("/user/:uid", async (req, res) => {
  const uid = req.params.uid;
  const user = await getUserByUID(uid);
  res.status(200).send({ data: user })
})

app.get("/user/history/:uid", async (req, res) => {
  const uid = req.params.uid;
  const matchHistory = await getMatchHistoryByUID(uid);
  res.status(200).send({ matchHistory: matchHistory})
})

app.post("/signup", (req, res) => {
  const data = req.body;
  console.log(data);

  if ("email" in data && "password" in data && "name" in data) {
    auth
      .createUser({
        email: data.email,
        displayName: data.name,
        password: data.password,
      })
      .then((userRecord) => {
        console.log("Successfully created new user:", userRecord.uid);
        addUserToDatabase(userRecord);
        res.status(200).send({ message: "user created", uid: userRecord.uid });
      })
      .catch((error) => {
        console.log("Error creating new user:", error);
        res.status(500).send({ message: "Server Error", error: error });
      });
    return;
  }
  res.status(400).send({ message: "Invalid form data!" });
});

app.get("/queue/:uid", async (req, res) => {
  const response = await checkQueueStatus("standard", req.params.uid);
  res.status(200).send(response)
})

app.post("/queue", async (req, res) => {
  const uid = req.body.uid;
  const game = await joinQueue(uid);
  console.log(game);
  if (game == -1)
    res.status(400).send({message: "Already in queue"})
  else
    if (typeof(game) === 'object') {
      console.log("FIND:" + findSidFromUid(game.player1));
      io.to(findSidFromUid(game.player1)).emit("game:created", game.game);
      io.to(findSidFromUid(game.player2)).emit("game:created", game.game);
    } else
      res.status(200).send({message: "Joined queue"})
})

app.post("/queue/cancel", async (req, res) => {
  const uid = req.body.uid;
  await leaveQueue(uid);
  res.status(200).send({message: "Left queue"})
})

io.on("connection", (socket) => {
  const uid = socket.handshake.auth.uid
  const sid = socket.id
  console.log("Client connected, sid:", socket.id, "uid:", uid);
  socket.emit("join", { message: "Created connection between " + sid + " and " + uid });

  activeClients[sid] = uid
  
  socket.on("friend:request", async (data) => {
    const fromUid = activeClients[socket.id];
    const toUid = data.to;

    const friendRequestId = await createFriendRequest(fromUid, toUid);
    if (friendRequestId == -1) return -1;

    // if reciever of request is online send toast
    const toSid = findSidFromUid(toUid);
    if (toSid != -1) {
      const fromUser = await getUserByUID(fromUid);
      io.to(toSid).emit("friend:reqRecieved", {reqId: friendRequestId, from: fromUser.displayName});
    }
    
    console.log("friend request created with id: " + friendRequestId)
  })

  socket.on("friend:accept", async (reqId) => {
    const documentId = await acceptFriendRequest(reqId);
    if (!documentId) return;
    console.log("accepted friend request id: " + documentId);
  })

  socket.on("friend:deny", async (reqId) => {
    const documentId = await denyFriendRequest(reqId);
    if (!documentId) return;
    console.log("denied friend request id: " + documentId);
  })

  socket.on("challenge:send", async (data) => {
    const challengerUid = activeClients[socket.id];
    const challengedUid = data.challenged;
    const challengedSid = findSidFromUid(challengedUid);
    if (challengedSid == -1) {
      console.log("challenged not online!");
      return;
    }

    const challenger = await getUserByUID(challengerUid);
    
    const challengeRequestId = await createChallengeRequest(challengerUid, challengedUid);
    const responseData = {
      challenger: challenger,
      challengeId: challengeRequestId
    }
    io.to(challengedSid).emit("challenge:request", responseData)
  })

  socket.on("challenge:accept", async (challengeId) => {
    const challenge = await acceptChallengeRequest(challengeId);
    const game = await createGameInstanceFromChallenge(challengeId);
    game.move_history = game.move_history || [];
    
    const player1 = findSidFromUid(challenge.challenger);
    const player2 = findSidFromUid(challenge.challenged);

    io.to(player1).emit("game:created", game);
    io.to(player2).emit("game:created", game);
  })

  socket.on("challenge:deny", async (challengeId) => {
    await denyChallengeRequest(challengeId);
    console.log(challengeId);
    //TODO: notify challenger of denial
  })

  socket.on("game:loaded", async (gameId) => {
    const gameData = await getGameInstance(gameId);
    if (!gameData) return -1;
    gameData.board = restructureBoard(gameData.board);

    const messages = await getMessagesFromGameChat(gameId);

    socket.emit("gamechat:update", messages)
    socket.emit("game:update", gameData);
  })

  socket.on("game:endTurn", async (gameId, board, move) => {
    const gameData = await getGameInstance(gameId);
    if (!gameData) return -1;
    
    console.log(move);
    
    gameData.turn += 1;
    gameData.player_turn = gameData.player_turn == "w" ? "b" : "w";
    gameData.board = board.flat();
    gameData.last_updated = new Date().toDateString();
    gameData.move_history = [...gameData.move_history, move];

    await updateGameInstance(gameId, gameData);

    // check for checkmate
    let winner = ""
    if (isCheckmate("w", board)) winner = "b"
    else if (isCheckmate("b", board)) winner = "w"
    
    // send back update
    gameData.board = board;
  
    io.to(findSidFromUid(gameData.w.uid)).emit("game:update", gameData);
    io.to(findSidFromUid(gameData.b.uid)).emit("game:update", gameData);
    if (winner != "") {
      await setWinnerGameInstance(gameId, winner);
      io.to(findSidFromUid(gameData.w.uid)).emit("game:end", {"winner": winner});
      io.to(findSidFromUid(gameData.b.uid)).emit("game:end", {"winner": winner});
    }
  })

  socket.on("game:surrender", async (player, gameId) => {
    const gameData = await getGameInstance(gameId);
    if (!gameData) return -1;

    const winner = player.color == "w" ? "b" : "w"

    await setWinnerGameInstance(gameId, winner);
    io.to(findSidFromUid(gameData.w.uid)).emit("game:end", {"winner": winner});
    io.to(findSidFromUid(gameData.b.uid)).emit("game:end", {"winner": winner});
  })

  socket.on("game:drawreq", async (gameId, player) => {
    const gameData = await getGameInstance(gameId);
    if (!gameData) return -1;

    const opponent = player.uid == gameData.w.uid ? gameData.b : gameData.w;
    const opponentSid = findSidFromUid(opponent.uid);
    io.to(opponentSid).emit("game:drawreq", gameId);
  })

  socket.on("game:drawaccept", async (gameId) => {
    const gameData = await getGameInstance(gameId);
    if (!gameData) return -1;

    const winner = "t"

    await setWinnerGameInstance(gameId, winner);
    io.to(findSidFromUid(gameData.w.uid)).emit("game:end", {"winner": winner});
    io.to(findSidFromUid(gameData.b.uid)).emit("game:end", {"winner": winner});
  })

  socket.on("game:drawdecline", async (opponent) => {
    const opponentSid = findSidFromUid(opponent.uid);
    io.to(opponentSid).emit("game:drawdeclined")
  })

  socket.on("rematch:request", async (data) => {
    console.log(data)
    const opponent = findSidFromUid(data.opponent);
    const rematchConfirmed = data.confirmed;

    if (rematchConfirmed) { // this is a terrible way of doing this, rematch checking should be handled on the backend not frontend
      const game = await createGameInstance(data.player, data.opponent);
      io.to(socket.id).emit("game:created", game);
      io.to(opponent).emit("game:created", game);
    } else {
      io.to(opponent).emit("rematch:challenge", {"message": "fight me"});
    }

  }) 

  socket.on("gamechat:send", async (messageData) => {
    const message = messageData.message;
    const senderUid = messageData.sender;
    const recieverUid = messageData.reciever;
    const gameId = messageData.gameId;

    const messages = await sendMessageToGameChat(senderUid, message, gameId);

    console.log(recieverUid);
    io.to(findSidFromUid(senderUid)).emit("gamechat:update", messages)
    io.to(findSidFromUid(recieverUid)).emit("gamechat:update", messages)
  })

  socket.on("disconnect", async () => {
    await leaveQueue(activeClients[socket.id]);
    delete activeClients[socket.id];
    console.log(socket.id, "has disconnected");
  });
});

server.listen(PORT, () => {
  console.log("listening on port " + PORT);
});
