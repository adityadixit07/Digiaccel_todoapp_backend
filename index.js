const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const todoRoutes = require("./routes/todoRoutes");
const dbConnect = require("./config/dbConnect");
dotenv.config();

const app = express();

// Define the port for your server
const PORT = process.env.PORT || 3001;
dbConnect();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: "GET,POST,PUT,DELETE",
    // allowedHeaders: "Content-Type,Authorization",
    AccessControlAllowOrigin: "*",
  })
);
app.use(morgan("dev"));

app.use("/api", todoRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
