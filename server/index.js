const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io')

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const io = new Server(server);


app.get('/', (req, res) => {
    res.send("<h1>HELLO</h1>");
})


io.on('connection', (socket) => {
    console.log("Client connected:", socket.id)
    socket.emit("join", {"message": "welcome!"})
    socket.on('disconnect', () => {
        console.log("a user disconnected")
    })
})


server.listen(PORT, () => {
    console.log("listening on port " + PORT);
})