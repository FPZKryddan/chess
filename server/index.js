require("dotenv").config();
const express = require("express");
const cors = require("cors");
const process = require("process");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const { auth } = require("./src/firebase.js");
const { addUserToDatabase, getFriendsFromUID, getUserByUID, 
  createChallengeRequest, acceptChallengeRequest, 
  denyChallengeRequest, createGameInstanceFromChallenge,
  getGameInstance, 
  updateGameInstance, getUsersActiveGames,
  setWinnerGameInstance} = require("./src/db.js");
const {restructureBoard, isCheckmate} = require('./src/chess/chess.js');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const io = new Server(server);

let activeClients = []

function findSidFromUid(uid) {
  console.log("hej")
  console.log(activeClients)
  const values = Object.values(activeClients)
  
  for (var sid in activeClients) {
    if (activeClients[sid] == uid)
      return sid
  }
  return -1;
}

app.get("/", (req, res) => {
  res.send("<h1>HELLO</h1>");
});

app.get("/games/:uid", async (req, res) => {
  const uid = req.params.uid;
  const games = await getUsersActiveGames(uid);
  console.log("results", games);
  res.send({data: games});
})

app.get("/friends/:uid", async (req, res) => {
  const uid = req.params.uid;
  const friends = await getFriendsFromUID(uid);

  console.log("results", friends);
  res.send({ data: friends });
});

app.get("/user/:uid", async (req, res) => {
  const uid = req.params.uid;
  const user = await getUserByUID(uid);
  console.log("results", user)
  res.send({ data: user })
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


io.on("connection", (socket) => {
  const uid = socket.handshake.auth.uid
  const sid = socket.id
  console.log("Client connected, sid:", socket.id, "uid:", uid);
  socket.emit("join", { message: "Created connection between " + sid + " and " + uid });

  activeClients[sid] = uid
  console.log(activeClients)
  
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
    gameData.board = restructureBoard(gameData.board);


    const w = await getUserByUID(gameData.w);
    gameData.w = {uid: gameData.w, displayName: w.displayName}
    const b = await getUserByUID(gameData.b);
    gameData.b = {uid: gameData.b, displayName: b.displayName}

    socket.emit("game:update", gameData);
  })

  socket.on("game:endTurn", async (gameId, board) => {
    const gameData = await getGameInstance(gameId);
    gameData.turn += 1;
    gameData.player_turn = gameData.player_turn == "w" ? "b" : "w";
    gameData.board = board.flat();

    await updateGameInstance(gameId, gameData);

    // check for checkmate
    let winner = ""
    if (isCheckmate("w", board)) winner = "b"
    else if (isCheckmate("b", board)) winner = "w"
    console.log("Winner: " + winner)
    
    // send back update
    gameData.board = board;
    
    const w = await getUserByUID(gameData.w);
    gameData.w = {uid: gameData.w, displayName: w.displayName}
    const b = await getUserByUID(gameData.b);
    gameData.b = {uid: gameData.b, displayName: b.displayName}
    
    io.to(findSidFromUid(gameData.w.uid)).emit("game:update", gameData);
    io.to(findSidFromUid(gameData.b.uid)).emit("game:update", gameData);
    if (winner != "") {
      await setWinnerGameInstance(gameId, winner);
      io.to(findSidFromUid(gameData.w.uid)).emit("game:end", {"winner": winner});
      io.to(findSidFromUid(gameData.b.uid)).emit("game:end", {"winner": winner});
    }
  })

  socket.on("disconnect", () => {
    delete activeClients[socket.id]
    console.log(activeClients)
    console.log(socket.id, "has disconnected");
  });
});

server.listen(PORT, () => {
  console.log("listening on port " + PORT);
});
