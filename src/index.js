import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { RoomModel } from "./rooms/model.js";

let onlineUsers = [];

// Create our Express application
const app = express();
// Configure our express application with middlewares and routes and all of that...
app.use(cors());
app.use(express.json());

app.get("/online-users", (req, res) => {
  res.send({ onlineUsers });
});

app.get("/chat/:room", async (req, res) => {
  const room = await RoomModel.findOne({ name: req.params.room });

  if (!room) {
    res.status(404).send();
    return;
  }

  res.send(room.chatHistory);
});

// Create a standard NodeJS httpServer based on our express application
const httpServer = createServer(app);

// Create a io Server based on our NodeJS httpServer
const io = new Server(httpServer, { allowEIO3: true });

io.on("connection", (socket) => {
  console.log(socket.id);

  socket.on("setUsername", ({ username, room }) => {
    onlineUsers.push({ username, id: socket.id, room: socket.id });

    socket.join(room);

    socket.emit("loggedin");

    socket.broadcast.emit("newConnection");
  });

  socket.on("sendmessage", async ({ message, room }) => {
    await RoomModel.findOneAndUpdate(
      { room },
      {
        $push: { chatHistory: message },
      }
    );

    socket.to(room).emit("message", message);
  });

  socket.on("disconnect", () => {
    console.log("disconnected socket " + socket.id);

    onlineUsers = onlineUsers.filter((user) => user.id !== socket.id);
  });
});

if (!process.env.MONGO_URL) {
  throw new Error("No MongoDB uri defined");
}

mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log("connected to mongo");
  httpServer.listen(3030);
});
