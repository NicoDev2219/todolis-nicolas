import { pool } from '../db.js';

const TASK_FIELDS = 'id, title, completed, due_date, created_at';

function sanitizeTitle(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export default async function taskRoutes(app) {
  // Lista as tarefas e permite filtrar por texto e situação.
  app.get('/api/tasks', async (request, reply) => {
    const { search = '', status = 'all' } = request.query;

    let query = `SELECT ${TASK_FIELDS} FROM tasks WHERE title LIKE ?`;
    const values = [`%${search}%`];

    if (status === 'pending') {
      query += ' AND completed = 0';
    }

    if (status === 'completed') {
      query += ' AND completed = 1';
    }

    query += ' ORDER BY (due_date IS NULL), due_date ASC, created_at DESC';

    const [tasks] = await pool.query(query, values);
    const [[summary]] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(completed = 1) AS completedCount,
        SUM(completed = 0) AS pendingCount
      FROM tasks
    `);

    return reply.send({
      tasks,
      summary: {
        total: Number(summary.total) || 0,
        completed: Number(summary.completedCount) || 0,
        pending: Number(summary.pendingCount) || 0,
      },
    });
  });

  // Cria uma nova tarefa.
  app.post('/api/tasks', async (request, reply) => {
    const { title, dueDate } = request.body ?? {};
    const cleanTitle = sanitizeTitle(title);

    if (!cleanTitle) {
      return reply.status(400).send({ message: 'Informe um título para cadastrar a tarefa.' });
    }

    if (cleanTitle.length > 255) {
      return reply.status(400).send({ message: 'O título deve ter no máximo 255 caracteres.' });
    }

    const [result] = await pool.query(
      'INSERT INTO tasks (title, completed, due_date) VALUES (?, false, ?)',
      [cleanTitle, dueDate || null]
    );

    const [[createdTask]] = await pool.query(
      `SELECT ${TASK_FIELDS} FROM tasks WHERE id = ?`,
      [result.insertId]
    );

    return reply.status(201).send(createdTask);
  });

  // Atualiza título, data ou situação da tarefa.
  app.patch('/api/tasks/:id', async (request, reply) => {
    const { id } = request.params;
    const { completed, title, dueDate } = request.body ?? {};

    const [[taskExists]] = await pool.query('SELECT id FROM tasks WHERE id = ?', [id]);
    if (!taskExists) {
      return reply.status(404).send({ message: 'Não foi encontrada uma tarefa com esse ID.' });
    }

    const updates = [];
    const params = [];

    if (typeof completed === 'boolean') {
      updates.push('completed = ?');
      params.push(completed);
    }

    if (title !== undefined) {
      const cleanTitle = sanitizeTitle(title);

      if (!cleanTitle) {
        return reply.status(400).send({ message: 'O título não pode ficar vazio.' });
      }

      if (cleanTitle.length > 255) {
        return reply.status(400).send({ message: 'O título deve ter no máximo 255 caracteres.' });
      }

      updates.push('title = ?');
      params.push(cleanTitle);
    }

    if (dueDate !== undefined) {
      updates.push('due_date = ?');
      params.push(dueDate || null);
    }

    if (updates.length === 0) {
      return reply.status(400).send({ message: 'Envie pelo menos um campo para atualizar.' });
    }

    params.push(id);
    await pool.query(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, params);

    const [[updatedTask]] = await pool.query(
      `SELECT ${TASK_FIELDS} FROM tasks WHERE id = ?`,
      [id]
    );

    return reply.send(updatedTask);
  });

  // Remove uma tarefa pelo ID.
  app.delete('/api/tasks/:id', async (request, reply) => {
    const { id } = request.params;
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return reply.status(404).send({ message: 'Não foi encontrada uma tarefa com esse ID.' });
    }

    return reply.status(204).send();
  });
}
