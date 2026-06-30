const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON payloads
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('Server is running smoothly!');
});

// Start listening for requests
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
