// Import libraries
import express from 'express';

const app = express();

// Serve static files from /public folder
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Express is live at http://localhost:${port}`);
});
