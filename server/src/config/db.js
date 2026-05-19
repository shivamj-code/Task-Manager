import mongoose from "mongoose";

const username = encodeURIComponent('shivamj_taskmanager');
const password = encodeURIComponent('Shivam@123');

const uri = `mongodb://${username}:${password}@ac-wijariy-shard-00-00.kuuwpdp.mongodb.net:27017,ac-wijariy-shard-00-01.kuuwpdp.mongodb.net:27017,ac-wijariy-shard-00-02.kuuwpdp.mongodb.net:27017/?ssl=true&replicaSet=atlas-f6fw6p-shard-0&authSource=admin&appName=Cluster0`;
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };


const connectDB = async () => {
  try {
    const conn = await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {

    console.error("Error connecting to MongoDB:", error);
    console.error(error.message);
    process.exit(1);
  }
};

export default connectDB;