import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import doteenv from 'dotenv';
import { ErrorMiddleware } from './middleware/error';

import userRouter from './routes/user.routes';
import courseRouter from './routes/course.routes';
import orderRouter from './routes/order.routes';

export const app = express();
doteenv.config();

//body parser - limita o tamanho do arquivo de dados.
app.use(express.json({ limit: '50mb' }));

//cookie-parser
app.use(cookieParser());

//cors
app.use(cors({
	origin: process.env.ORIGIN,
}));

//routes
app.use('/api/v1', userRouter, orderRouter, courseRouter);

//API Test
app.get('/test', (req: Request, res: Response) => {
	res.status(200).json({
		success: true,
		message: 'Api is working'
	});
});


//unknown routes
app.all('*', (req: Request, res: Response, next: NextFunction) => {
	const err = new Error(`Route ${req.originalUrl} not found`) as any;
	err.statusCode = 404
	next(err);
});


app.use(ErrorMiddleware);
