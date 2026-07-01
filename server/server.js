const express = require('express');
const cors = require('cors');
const authRoutes = require("./routes/authRoutes");
require("dotenv").config();

const app = express();

app.use(cors());
const PORT = process.env.PORT || 5000;

const connectDB = require("./config/db");

connectDB();

// Middleware to parse incoming JSON payloads
app.use(express.json());


// Root route
app.get('/', (req, res) => {
  res.send('Server is running smoothly!');
});

app.use("/api/auth", authRoutes); // Use the auth routes for authentication-related endpoints

// Start listening for requests
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
