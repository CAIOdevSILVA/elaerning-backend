import { app } from './app';
import doteenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { connectDb } from './utils/db';

doteenv.config();


//cloudinary
cloudinary.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.CLOUD_API_KEY,
	api_secret: process.env.CLOUD_SECRET_KEY,
});

app.listen(process.env.PORT, () => {
	console.log('Server is running in PORT 8080');
	connectDb();
});
