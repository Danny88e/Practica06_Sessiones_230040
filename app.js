
import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import os from "os";
import Session from "./model.js"; 
import './index.js'; 

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

// Sesiones almacenadas en memoria.
app.use(
    session({
        secret: " P6-LDSEFrankCastle",
        resave:false,
        saveUninitialized: false,
        cookie:{maxAge: 5*68*1000},

    })
);

//hola 
app.get('/' ,(request,response) =>{
  return response.status(200).json({message:"bienvenido a la Api de control de sesiones",
                                        author:"Luis Daniel Suarez Escamilla."})
})


const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"] || // Contiene la IP del cliente
    req.connection.remoteAddress || // IP del cliente desde la conexión de red principal.
    req.socket.remoteAddress || // IP directamente desde el socket de la conexión.
    req.connection.socket?.remoteAddress // Otra forma de obtener la IP, en caso de que las demás no funcionen.
  );
};

const sessions = {};

const getServerNetworkInfo = () => {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) { 
      if (iface.family === 'IPv4' && !iface.internal) { 
        return { serverIp: iface.address, serverMac: iface.mac };
      }
    }
  }
};

app.post("/login", async (req, res) => {
  const { email, nickname, macAddress } = req.body;

  if (!email || !nickname || !macAddress) {
    return res.status(400).json({ message: "Falta algún campo." });
  }

  const sessionId = uuidv4();
  const now = new Date();
  const clientIp = getClientIp(req); // IP del cliente
  const { serverIp, serverMac } = getServerNetworkInfo(); // IP y MAC del servidor

  try {
    // Crear nueva sesión en la base de datos
    const session = new Session({
      sessionId,
      email,
      nickname,
      clientIp,
      clientMac: macAddress, // Cambiado de macAddress a clientMac según el esquema
      serverIp,
      serverMac,
      createdAt: now,
      lastAccessedAt: now,
      duration: 0,
      inactivityTime: 0,
      status: "Activa", // Estado inicial de la sesión
    });

    // Guardar en la base de datos
    await session.save();

    res.status(200).json({
      message: "Inicio de sesión exitoso.",
      sessionId,
      clientIp,
      serverIp,
      serverMac,
      clientMac: macAddress,
    });
  } catch (error) {
    console.error("Error al guardar la sesión en la base de datos:", error);
    res.status(500).json({ message: "Error al registrar la sesión." });
  }
});

app.post("/logout", async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
      return res.status(400).json({ message: "El ID de sesión es obligatorio." });
  }

  try {
      // Buscar la sesión en la base de datos usando findOne()
      const session = await Session.findOne({ sessionId });

      if (!session) {
          return res.status(404).json({ message: "No se ha encontrado una sesión activa." });
      }

      session.status = "Finalizada por el usuario";
      session.lastAccessedAt = new Date();

      await session.save();

      req.session?.destroy((err) => {
          if (err) {
              return res.status(500).json({ message: "Error al cerrar la sesión en el servidor." });
          }
      });

      res.status(200).json({ message: "Logout exitoso." });
  } catch (error) {
      console.error("Error al cerrar la sesión:", error);
      res.status(500).json({ message: "Error al actualizar la sesión en la base de datos." });
  }
});


//update 
app.put("/update", async (req, res) => {
  const { sessionId, email, nickname, status } = req.body; // Extraemos los datos

  if (!sessionId) {
    return res.status(400).json({ message: "El ID de sesión es obligatorio." });
  }

  try {
    // Buscar la sesión en la base de datos usando findOne()
    const session = await Session.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ message: "No existe una sesión activa." });
    }

    // Actualizar los campos solo si se proporcionan
    if (email) session.email = email;
    if (nickname) session.nickname = nickname;
    if (status) session.status = status; // Actualizar el estado
    session.lastAccessedAt = new Date(); // Actualizar la fecha y hora de último acceso

    // Guardar los cambios en la base de datos
    await session.save();

    res.status(200).json({
      message: "Sesión actualizada correctamente.",
      session: {
        sessionId,
        email: session.email,
        nickname: session.nickname,
        lastAccessedAt: session.lastAccessedAt,
        status: session.status,
      },
    });
  } catch (error) {
    console.error("Error al actualizar la sesión:", error);
    res.status(500).json({ message: "Error al actualizar la sesión." });
  }
});


app.get("/status", async (req, res) => {
  const { sessionId } = req.query; // Requiere el ID de la sesión

  if (!sessionId) {
    return res.status(400).json({ message: "El ID de sesión es obligatorio." });
  }

  try {
    // Buscar la sesión en la base de datos usando el método findOne() de Mongoose
    const session = await Session.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ message: "No se ha encontrado una sesión activa." });
    }

    // Si la sesión es encontrada, retornamos la información de la sesión
    res.status(200).json({
      message: "Sesión activa.",
      session,
    });
  } catch (error) {
    console.error("Error al obtener la sesión de la base de datos:", error);
    res.status(500).json({ message: "Error al recuperar la sesión." });
  }
});


//todas las sessiones cagalar 

app.get("/allSessions", async (req, res) => {
  try {
    // Recuperar todas las sesiones desde la base de datos
    const allSessions = await Session.find({});

    if (allSessions.length === 0) {
      return res.status(404).json({ message: "No hay sesiones registradas." });
    }

    res.status(200).json({
      message: "Listado de todas las sesiones.",
      sessions: allSessions,
    });
  } catch (error) {
    console.error("Error al recuperar las sesiones de la base de datos:", error);
    res.status(500).json({ message: "Error al recuperar las sesiones." });
  }
});

const getAllCurrentSessions = async () => {
  return await Session.find({ status: "Activa" });
};

app.get("/AllCurrentSessions", async (req, res) => {
  try {
      const activeSessions = await getAllCurrentSessions();
      res.status(200).json({ message: "Sesiones activas recuperadas.", sessions: activeSessions });
  } catch (error) {
      res.status(500).json({ message: "Error al recuperar sesiones activas." });
  }
});


app.delete("/deleteSessions" , async (req,res)=>{
  try {
    await Session.deleteMany({});
    res.status(200).json({
      message: "todas las sessiones han sido borrradas compache"
    })
  } catch (error) {
    console.log("error el borrar todas compache")
    res.status(500).json ({
      message:("error al eliminar las sessiones compa ya te dije")
    })
    
  }
})











app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});




export default app;




