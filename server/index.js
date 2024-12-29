require("dotenv").config();
const express = require("express");
const cors = require("cors");
const process = require("process");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const { auth } = require("./src/firebase.js");
const { addUserToDatabase, getFriendsFromUID, getUserByUID } = require("./src/db.js");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const io = new Server(server);

app.get("/", (req, res) => {
  res.send("<h1>HELLO</h1>");
});

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
  console.log("Client connected:", socket.id);
  socket.emit("join", { message: "welcome!" });
  socket.on("disconnect", () => {
    console.log("a user disconnected");
  });
});

server.listen(PORT, () => {
  console.log("listening on port " + PORT);
});
