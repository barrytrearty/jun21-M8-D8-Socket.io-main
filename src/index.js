import express from "express";
import cors from "cors"
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { RoomModel } from "./rooms/model.js";

let onlineUsers = []

// Create our Express application
const app = express();
// Configure our express application with middlewares and routes and all of that...
app.use(cors())
app.use(express.json())

app.get('/online-users', (req, res) => {
    res.send({ onlineUsers })
})

app.get('/chat/:room', async (req, res) => {
    const room = await RoomModel.findOne({ name: req.params.room })

    if (!room) {
        res.status(404).send()
        return
    }

    res.send(room.chatHistory)
})

// Create a standard NodeJS httpServer based on our express application
const httpServer = createServer(app);

// Create a io Server based on our NodeJS httpServer
const io = new Server(httpServer, { allowEIO3: true });

io.on("connection", (socket) => {
    console.log(socket.id)

    socket.on("setUsername", ({ username, room }) => {
        // With this username:
        // we can now save the username in a list of online users

        onlineUsers.push({ username, id: socket.id, room })

        socket.join(room)

        // we can emit back a logged in message to the client
        socket.emit("loggedin")

        // we can emit an event to all other clients, i.e. excluding this one
        socket.broadcast.emit("newConnection")

        // this is how you emit an event to EVERY client, including this one
        //io.sockets.emit("someevent")
    })

    socket.on("sendmessage", async ({ message, room }) => {

        // console.log(room)

        // we need to save the message to the Database

        // try {

        //     throw new Error("Something went wrong")

        await RoomModel.findOneAndUpdate({ room },
            {
                $push: { chatHistory: message }
            })

        // socket.broadcast.emit("message", message)
        socket.to(room).emit("message", message)


        // } catch (error) {
        //     socket.emit("message-error", { error: error.message })
        // }

    })

    socket.on("disconnect", () => {
        console.log("disconnected socket " + socket.id)

        onlineUsers = onlineUsers.filter(user => user.id !== socket.id)
    })

});

// We are starting our httpServer rather than our express application
// If we started our express applicaiton, that would create a separate httpServer

// app.listen(3000) // this creates a separate httpServer
// unrelated to the one we have passed to the io Server Configure
// tldr: will not work

if (!process.env.MONGO_URL) {
    throw new Error("No MongoDB uri defined")
}

mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log("connected to mongo")
    httpServer.listen(3030);
})
