import { Redis } from 'ioredis';

import doteenv from 'dotenv';
doteenv.config();

const redisClient = () => {
	if(process.env.REDIS_URL){
		console.log('Redis Connected');
		return process.env.REDIS_URL;
	}
	throw new Error('Redis connection failed');
}

export const redis = new Redis(redisClient());
