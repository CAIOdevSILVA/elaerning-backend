import { Response } from 'express';
import { redis } from '../utils/redis';
import { userModel } from '../models/user.model';

export const getUserById = async(id: string, res: Response) => {
	const userJson = await redis.get(id);

	if(userJson){
		const user = JSON.parse(userJson);
		res.status(200).json({
			status: 'success',
			user
		});
	};}
