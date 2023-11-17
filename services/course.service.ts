import { NextFunction, Response } from 'express';
import { courseModel } from '../models/course.model';
import { CatchAsyncErrors } from '../middleware/catchAsyncErrors';

//create course
export const createCourse = CatchAsyncErrors(async(data: any, res: Response) => {
	const course = await courseModel.create(data);

	res.status(201).json({
		success: true,
		course,
	});
});

//get all courses
export const getAllCoursesService = async(res: Response) => {
	const courses = await courseModel.find().sort({ createdAt: -1 });

	res.status(200).json({
		success: true,
		courses
	});
}
