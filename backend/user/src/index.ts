import express from 'express';
import dotenv from 'dotenv';
import connectDb from './config/db.js';
import { Redis } from '@upstash/redis';
import userRoutes from './routes/user.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import cors from 'cors';

dotenv.config();

connectDb();
connectRabbitMQ();

// Redis connection
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error('REDIS_URL must be defined');
}
const parsedUrl = new URL(redisUrl);
export const redisClient = new Redis({
  url: `https://${parsedUrl.hostname}`,
  token: parsedUrl.password
});

(async () => {
  try {
    await redisClient.ping();
    console.log('Connected to Redis via Upstash REST');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    process.exit(1);
  }

  const app = express();
  app.use(express.json());
  app.use(cors());

  app.use('/api/v1', userRoutes);

  const port = process.env.PORT || 5000;

  app.listen(port, () => {
    console.log(`server is running on port ${port}`);
  });
})();
