import mongoose from "mongoose"
import { RoomSchema } from './schema.js'

export const RoomModel = mongoose.model("rooms", RoomSchema);