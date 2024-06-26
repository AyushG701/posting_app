import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";

// security package
import helmet from "helmet";
import errorHandler from "./middleware/errorHandler.js";
import router from "./routes/index.js";
import dbConnection from "./db/index.js";

const __dirname = path.resolve(path.dirname(""));

dotenv.config();

const app = express();

app.use(express.static(path.join(__dirname, "views/build")));

const PORT = process.env.PORT || 8000;

dbConnection();
// middleware
app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(router);
// error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`SErver is running on the port ${PORT}`);
});
