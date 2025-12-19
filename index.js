const express = require('express');
const app = express();

app.use(express.json());

app.post('/payments/callback', (req, res) => {
  console.log('Callback received:', req.body);
  res.send('OK');
});

app.get('/', (req, res) => {
  res.send('TajPhone API is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
