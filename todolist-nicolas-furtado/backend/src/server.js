import Fastify from 'fastify';
import cors from '@fastify/cors';
import 'dotenv/config';
import { pool } from './db.js';
import taskRoutes from './routes/tasks.js';

const app = Fastify({ logger: true });
const port = Number(process.env.PORT) || 3333;

await app.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
});

app.get('/', async () => ({
  project: 'TodoList API',
  author: 'Nicolas Furtado',
  status: 'online',
}));

app.get('/health', async () => ({
  status: 'ok',
  service: 'todolist-api',
}));

await app.register(taskRoutes);

async function prepareDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      due_date DATE NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

try {
  await prepareDatabase();
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`TodoList de Nicolas Furtado disponível em http://localhost:${port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
