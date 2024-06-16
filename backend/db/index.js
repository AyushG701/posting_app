import mongoose from "mongoose";
// import dotenv from "dotenv";

// dotenv.config();

const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("DB Connected Successfully");
  } catch (error) {
    console.error("DB Error: ", error);
  }
};

export default dbConnection;
