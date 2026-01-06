const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.json({ 
    message: "Hello from DevSecOps (Tools/Dev/Prod)!", 
    env: process.env.NODE_ENV || "unknown", 
    version: "2.0" 
  });
});

app.get('/health', (req, res) => res.json({status: 'UP'}));

app.listen(port, () => console.log(`App running on port ${port}`));
