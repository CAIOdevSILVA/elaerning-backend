import mongoose from 'mongoose';

import dotenv from 'dotenv';
dotenv.config();

const dbUrl: string = process.env.MONGO_DB_URL || '';

export const connectDb = async() => {
	try {
		await mongoose.connect(dbUrl).then((data: any) => {
			console.log('Database connected');
		})

	} catch (error: any) {
		console.log(error.message);
		setTimeout(connectDb, 5000);
	}
};
