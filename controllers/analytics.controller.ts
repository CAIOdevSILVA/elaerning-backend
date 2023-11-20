import { Request, Response, NextFunction } from 'express';
import { CatchAsyncErrors } from '../middleware/catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';
import { generateLast12MonthData } from '../utils/analytics.generator';
import { userModel } from '../models/user.model';
import { courseModel } from '../models/course.model';
import { orderModel } from '../models/order.model';

//get users analytics --only for admin
export const getUsersAnalytics = CatchAsyncErrors(async(req: Request, res: Response, next: NextFunction) => {
	try {
		const users = await generateLast12MonthData(userModel);

		res.status(200).json({
			success: true,
			users,
		});
	} catch (error: any) {
		return next(new ErrorHandler(error.message, 500));
	}
});

//get course analytics --only for admin
export const getCoursesAnalytics = CatchAsyncErrors(async(req: Request, res: Response, next: NextFunction) => {
	try {
		const courses = await generateLast12MonthData(courseModel);

		res.status(200).json({
			success: true,
			courses,
		});
	} catch (error: any) {
		return next(new ErrorHandler(error.message, 500));
	}
});

//get orders analytics --only for admin
export const getOrdersAnalytics = CatchAsyncErrors(async(req: Request, res: Response, next: NextFunction) => {
	try {
		const orders = await generateLast12MonthData(orderModel);

		res.status(200).json({
			success: true,
			orders,
		});
	} catch (error: any) {
		return next(new ErrorHandler(error.message, 500));
	}
});
