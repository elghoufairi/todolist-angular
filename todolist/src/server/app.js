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

function handleUpdateAndInsert(queryToUpdate, paramsToUpdate, queryToInsert, paramsToInsert, res) {
  connection.beginTransaction((transactionErr) => {
    if (transactionErr) {
      console.error('Error starting transaction:', transactionErr);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }

    connection.query(queryToUpdate, paramsToUpdate, (updateErr, updateResult) => {
      if (updateErr || updateResult.affectedRows === 0) {
        console.error('Error updating task:', updateErr);
        return connection.rollback(() => {
          res.status(500).json({ success: false, error: 'Internal Server Error' });
        });
      }

      connection.query(queryToInsert, paramsToInsert, (insertErr, insertResult) => {
        if (insertErr) {
          console.error('Error inserting task:', insertErr);
          return connection.rollback(() => {
            res.status(500).json({ success: false, error: 'Internal Server Error' });
          });
        }

        connection.commit((commitErr) => {
          if (commitErr) {
            console.error('Error committing transaction:', commitErr);
            return connection.rollback(() => {
              res.status(500).json({ success: false, error: 'Internal Server Error' });
            });
          }

          res.json({ success: true });
        });
      });
    });
  });
}
app.get('/tasks', (req, res) => {
    const query = 'SELECT id, task, date FROM tasks';
  
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

  connection.query('SELECT * FROM tasks WHERE id = ?', [taskId], (selectErr, selectResult) => {
    if (selectErr) {
      console.error('Error selecting task:', selectErr);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }

    if (selectResult.length === 0) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const toDoTask = selectResult[0];

    const updateQuery = 'UPDATE tasks SET status = ? WHERE id = ?';
    const updateParams = ['doing', taskId];
    const insertQuery = 'INSERT INTO doing_tasks (id, task, date) VALUES (?, ?, ?)';
    const insertParams = [toDoTask.id, toDoTask.task, toDoTask.date];

    handleUpdateAndInsert(updateQuery, updateParams, insertQuery, insertParams, res);
  });
});

app.put('/tasks/move-to-done/:taskId', (req, res) => {
    const taskId = req.params.taskId;
  
    connection.query('SELECT * FROM doing_tasks WHERE id = ?', [taskId], (selectErr, selectResult) => {
      if (selectErr) {
        console.error('Error selecting task:', selectErr);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
      }
  
      if (selectResult.length === 0) {
        return res.status(404).json({ success: false, error: 'Task not found in doing_tasks' });
      }
  
      const doingTask = selectResult[0];
  
      const updateQuery = 'UPDATE doing_tasks SET status = ? WHERE id = ?';
      const updateParams = ['done', taskId];
      const insertQuery = 'INSERT INTO done_tasks (id, task, date) VALUES (?, ?, ?)';
      const insertParams = [doingTask.id, doingTask.task, doingTask.date];
  
      handleUpdateAndInsert(updateQuery, updateParams, insertQuery, insertParams, res);
    });
  });
  app.get('/done-tasks', (req, res) => {
    const query = 'SELECT id, task, date FROM done_tasks';
  
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching done tasks:', err);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
      } else {
        res.json(results);
      }
    });
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

app.get('/tasks/:taskId', (req, res) => {
    const taskId = req.params.taskId;
    const table = determineTable(req.params.status);
  
    if (!table) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
  
    const query = `SELECT id, task, date FROM ${table} WHERE id = ?`;
  
    connection.query(query, [taskId], (err, result) => {
      if (err) {
        console.error('Error fetching task:', err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
      }
  
      if (result.length === 0) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }
  
      res.json({ success: true, task: result[0] });
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
