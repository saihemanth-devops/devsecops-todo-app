const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

let todos = [{ id: 1, task: "DevSecOps Initialized", done: true }];

// Health Check
app.get('/health', (req, res) => res.json({status: 'UP'}));

app.get('/todos', (req, res) => res.json(todos));

app.post('/todos', (req, res) => {
    const newTodo = { id: todos.length + 1, task: req.body.task, done: false };
    todos.push(newTodo);
    res.status(201).json(newTodo);
});

app.listen(port, () => console.log(`App running on ${port}`));
