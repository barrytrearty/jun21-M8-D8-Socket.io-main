import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    text: { type: String },
    sender: { type: String },
    timestamp: { type: Number },
    id: { type: String },
})

export const RoomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    chatHistory: {
        type: [MessageSchema],
        required: true,
        default: []
    }
})