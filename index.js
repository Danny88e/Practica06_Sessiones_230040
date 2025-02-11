// Aquí va la conexión a la base de datos de MongoDB
import mongoose from 'mongoose';
mongoose.connect('mongodb+srv://DaniDeuz:luisdaniel05@danideuz.4uhhl.mongodb.net/session_db?retryWrites=true&w=majority&appName=DaniDeuz')
  .then((db) => console.log('Mongodb atlas connected'))
  .catch((error) => console.error(error));

export default mongoose;
