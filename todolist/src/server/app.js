const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'todo_app'
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});



app.get('/tasks', (req, res) => {
  const query = `
    SELECT 'to_do' AS status, id, task, date FROM tasks
    UNION ALL
    SELECT 'doing' AS status, id, task, date FROM doing_tasks
    UNION ALL
    SELECT 'done' AS status, id, task, date FROM done_tasks
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching tasks:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
    res.json(results);
  });
});

app.get('/doing-tasks', (req, res) => {
  const query = 'SELECT id, task, date FROM doing_tasks';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching tasks in doing:', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});

app.post('/tasks', (req, res) => {
  const newTask = req.body;
  connection.query('INSERT INTO tasks SET ?', newTask, (err, result) => {
    if (err) {
      console.error('Error adding task:', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else {
      res.json({ success: true, insertId: result.insertId });
    }
  });
});

app.put('/tasks/move-to-doing/:taskId', (req, res) => {
    const taskId = req.params.taskId;
  
    // Update 'to_do' task status to 'doing' in the 'tasks' table
    connection.query('UPDATE tasks SET status = ? WHERE id = ?', ['doing', taskId], (err, result) => {
      if (err) {
        console.error('Error moving task to doing:', err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }
  
      res.json({ success: true });
    });
  });
  
  
  
app.put('/tasks/move-to-done/:taskId', (req, res) => {
  const taskId = req.params.taskId;

  const updateQuery = 'UPDATE doing_tasks SET status = ? WHERE id = ?';
  const updateParams = ['done', taskId];

  handleUpdateAndInsert(updateQuery, updateParams, '', [], res);
});

app.delete('/tasks/remove-doing/:taskId', (req, res) => {
  const taskId = req.params.taskId;

  connection.query('DELETE FROM doing_tasks WHERE id = ?', [taskId], (err, result) => {
    if (err) {
      console.error('Error removing task from doing:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
    res.json({ success: true });
  });
});

app.delete('/tasks/remove-done/:taskId', (req, res) => {
  const taskId = req.params.taskId;

  connection.query('DELETE FROM done_tasks WHERE id = ?', [taskId], (err, result) => {
    if (err) {
      console.error('Error removing task from done:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
    res.json({ success: true });
  });
});

app.delete('/tasks/:status/:taskId', (req, res) => {
  const { status, taskId } = req.params;
  const table = determineTable(status);

  if (!table) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  const query = `DELETE FROM ${table} WHERE id = ?`;

  connection.query(query, [taskId], (err, result) => {
    if (err) {
      console.error('Error removing task:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({ success: true });
  });
});

function determineTable(status) {
  switch (status) {
    case 'to_do':
      return 'tasks';
    case 'doing':
      return 'doing_tasks';
    case 'done':
      return 'done_tasks';
    default:
      return null;
  }
}


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
