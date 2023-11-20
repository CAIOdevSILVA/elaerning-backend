import { Request, Response, NextFunction } from 'express';
import { CatchAsyncErrors } from '../middleware/catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';
import { generateLast12MonthData } from '../utils/analytics.generator';
import { userModel } from '../models/user.model';

//get users analytics --only for users
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
