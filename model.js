import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  nickname: { type: String, required: true },
  clientIp: { type: String, required: true },
  clientMac: { type: String, required: true },
  serverIp: { type: String, required: true },
  serverMac: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastAccessedAt: { type: Date, default: Date.now },
  duration: { type: Number, default: 0 },
  inactivityTime: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ["Activa", "Inactiva", "Finalizada por el Usuario", "Finalizada por Falla de Sistema"], 
    default: "Activa" 
  }
});

const Session = mongoose.model("Session", SessionSchema, "sessions");

export default Session;