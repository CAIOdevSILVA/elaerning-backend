import { Request, Response, NextFunction } from "express";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import { orderModel, IOrder } from '../models/order.model';
import { userModel } from '../models/user.model';
import { courseModel } from '../models/course.model';
import { notificationModel } from '../models/notification.model';
import path from 'path';
import ejs from 'ejs';
import sendMailToUser from '../utils/sendMails';
import { getAllOrdersService, newOrder } from '../services/order.service';

//create order
export const createOrder = CatchAsyncErrors(async(req: Request, res: Response, next: NextFunction) => {
	try {
		const { courseId, payment_info } = req.body as IOrder;
		const user = await userModel.findById(req.user?._id);
		const courseExistInUser = user?.courses.some((course: any) => course._id.toString() === courseId);

		if(courseExistInUser){
			return next(new ErrorHandler('You have already purchased this course', 400));
		};

		const course = await courseModel.findById(courseId);

		if(!course){
			return next(new ErrorHandler('Course not found', 404));
		};

		const data: any = {
			courseId: course._id,
			userId: user?._id,
			payment_info,
		};

		const mailData = {
			order: {
				_id: course._id.toString().slice(0, 6),
				name: course.name,
				price: course.price,
				date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
			}
		};

		const html = await ejs.renderFile(path.join(__dirname, '../mails/order-confirmation.ejs'), {order: mailData});

		try {
			await sendMailToUser({
				email: user?.email!,
				subject: 'Order Confirmation',
				template: 'order-confirmation.ejs',
				data: mailData
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		};

		user?.courses.push(course?._id);

		await user?.save();

		await notificationModel.create({
			user: user?._id,
			title: 'New Order',
			message: `You have a new order from ${course?.name}`
		});

		await courseModel.findByIdAndUpdate(courseId, { $set: { purchased: course.purchased! + 1 } });


		newOrder(data, res, next);
	} catch (error: any) {
		return next(new ErrorHandler(error.message, 500));
	}
});

//get all orders -- only admin
export const getAllOrders = CatchAsyncErrors(async(req: Request, res: Response, next: NextFunction) => {
	try {
		getAllOrdersService(res);
	} catch (error: any) {
		return next(new ErrorHandler(error.message, 500));
	}
});
