import { app } from './app';
import doteenv from 'dotenv';
import { connectDb } from './utils/db';

doteenv.config();

app.listen(process.env.PORT, () => {
	console.log('Server is running in PORT 8080');
	connectDb();
});
