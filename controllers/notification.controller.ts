import { Request, Response, NextFunction } from 'express';
import { notificationModel } from '../models/notification.model';
import { CatchAsyncErrors } from '../middleware/catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';

//get all notifications --only for admin
export const getNotifications = CatchAsyncErrors(async(req: Request, res: Response, next: NextFunction) => {
	try {
		const notifications = await notificationModel.find().sort({ createdAt: -1 })

		res.status(200).json({
			success: true,
			notifications,
		});
	} catch (error: any) {
		return next(new ErrorHandler(error.message, 500));
	}
});

//update notification status --only admin
export const updateNotificationStatus = CatchAsyncErrors(async(req: Request, res: Response, next: NextFunction) => {
	try {
		const notification = await notificationModel.findById(req.params.id);
		if(!notification){
			return next(new ErrorHandler('Notification not found', 404));
		} else {
			notification.status ? notification.status = 'read' : notification?.status;
		};

		await notification.save();

		const notifications = await notificationModel.find().sort({ craetedAt: -1 });

		res.status(200).json({
			success: true,
			notifications
		});
	} catch (error: any) {
		return next(new ErrorHandler(error.message, 500));
	}
});
