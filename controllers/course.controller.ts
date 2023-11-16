import { Request, Response, NextFunction } from "express";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse } from "../services/course.service";
import { courseModel } from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import path from 'path';
import ejs from 'ejs';
import sendMailToUser from '../utils/sendMails';

//Add question in course
interface IAddQuestionData {
	question: string;
	courseId: string;
	contentId: string;
}

//Add answer in question
interface IAddAnswerData {
	answer: string;
	courseId: string;
	contentId: string;
	questionId: string;
}

//add review in course
interface IReviewData {
	review: string;
	rating: number;
	userId: string;
}

//add reply in review
interface IAddReviewData {
	comment: string;
	courseId: string;
	reviewId: string;
}

//upload course
export const uploadCourse = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const data = req.body;
			const thumbnail = data.thumbnail;

			if (thumbnail) {
				const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
					folder: "courses",
				});

				data.thumbnail = {
					public_id: myCloud.public_id,
					url: myCloud.secure_url,
				};
			}

			createCourse(data, res, next);
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

//edit course
export const editCourse = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const data = req.body;
			const thumbnail = data.thumbnail;

			if (thumbnail) {
				await cloudinary.v2.uploader.destroy(thumbnail.public_id);

				const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
					folder: "courses",
				});

				data.thumbnail = {
					public_id: myCloud.public_id,
					url: myCloud.secure_url,
				};
			}

			const courseId = req.params.id;

			const course = await courseModel.findByIdAndUpdate(
				courseId,
				{
					$set: data,
				},
				{ new: true }
			);

			res.status(201).json({
				success: true,
				course,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

//get single course --- without purchasing -- everyone can access this route
export const getSingleCourse = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const courseId = req.params.id;
			const isCacheExist = await redis.get(courseId);

			if (isCacheExist) {
				const course = JSON.parse(isCacheExist);
				res.status(200).json({
					success: true,
					course,
				});
			} else {
				const course = await courseModel
					.findById(courseId)
					.select(
						"-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
					);

				await redis.set(courseId, JSON.stringify(course));

				res.status(200).json({
					success: true,
					course,
				});
			}
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

//get single course --- without purchasing -- everyone can access this route
export const getAllCourse = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const isCacheExist = await redis.get("allCourses");

			if (isCacheExist) {
				const courses = JSON.parse(isCacheExist);
				res.status(200).json({
					success: true,
					courses,
				});
			} else {
				const courses = await courseModel
					.find()
					.select(
						"-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
					);

				await redis.set("allCourse", JSON.stringify(courses));

				res.status(200).json({
					success: true,
					courses,
				});
			}
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

//get course content -- only for valid users
export const getCourseByUser = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userCourseList = req.user?.courses;
			const courseId = req.params.id;

			const courseExists = userCourseList?.find(
				(course: any) => course._id.toString() === courseId
			);

			if (!courseExists) {
				return next(
					new ErrorHandler("Yout are not eligible to access this course", 404)
				);
			}

			const course = await courseModel.findById(courseId);

			const content = course?.courseData;

			res.status(200).json({
				success: true,
				content,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

//add question
export const addQuestion = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { question, courseId, contentId }: IAddQuestionData = req.body;
			const course = await courseModel.findById(courseId);

			if (!mongoose.Types.ObjectId.isValid(contentId)) {
				return next(new ErrorHandler("Invalid contentId", 400));
			}

			const courseContent = course?.courseData.find((item: any) =>
				item._id.equals(contentId)
			);

			if (!courseContent) {
				return next(new ErrorHandler("Invalid contentId", 400));
			}

			//create a new question object
			const newQuestion: any = {
				user: req.user,
				question,
				questionReplies: [],
			};

			//add this question to our course content
			courseContent?.questions.push(newQuestion);

			//save the updated course
			await course?.save();

			res.status(200).json({
				success: true,
				course,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

//add answer to question in course
export const addAnswerInQuestion = CatchAsyncErrors(async(req: Request, res: Response, next:NextFunction) => {
	try {
		const { answer, courseId, contentId, questionId }: IAddAnswerData = req.body;
		const course = await courseModel.findById(courseId);

		if (!mongoose.Types.ObjectId.isValid(contentId)) {
			return next(new ErrorHandler("Invalid contentId", 400));
		}

		const courseContent = course?.courseData.find((item: any) =>
			item._id.equals(contentId)
		);

		if (!courseContent) {
			return next(new ErrorHandler("Invalid contentId", 400));
		};

		const question = courseContent?.questions.find((item: any) => item._id.equals(questionId));

		if (!question) {
			return next(new ErrorHandler("Invalid contentId", 400));
		};

		//add answer object
		const newAnswer: any = {
			user: req.user,
			answer,
		};

		//add this answer in our course content
		question?.questionReplies.push(newAnswer);

		//save updated question in our db
		await course?.save();

		if(req.user?._id === question.user._id){
			//create a notification
		} else{
			//send a email to user
			const data = {
				name: question.user.name,
				title: courseContent.title
			};

			const html = await ejs.renderFile(path.join(__dirname, '../mails/question-reply.ejs'), data);

			try {
				await sendMailToUser({
					email: question.user.email,
					subject: 'Question Reply',
					template: 'question-reply-ejs',
					data,
				});
			} catch (error: any) {
				return next(new ErrorHandler(error.message, 501));
			}
		};

		res.status(200).json({
			success: true,
			course
		});
	}	catch (error: any) {
		return next(new ErrorHandler(error.message, 500));
	}
});

//add review in course
export const addReview = CatchAsyncErrors(async(req: Request, res: Response, next: NextFunction) => {
	try {
		const userCourseList = req.user?.courses;
		const courseId = req.params.id;
		const { review, rating } = req.body as IReviewData;
		const course = await courseModel.findById(courseId);

		// check if courseId already exists in userCourseList based on _id
		const courseExists = userCourseList?.some((course:any) => course._id.toString() === courseId.toString());

		if(!courseExists){
			return next(new ErrorHandler('You are not eligible to access this course', 400 ));
		};

		const reviewData: any = {
			user: req.user,
			rating,
			comment: review
		};

		course?.reviews.push(reviewData);

		let avg = 0; //inital value of rating
		course?.reviews.forEach((rev: any) => {
			avg += rev.rating;
		});

		if(course){
			course.ratings = Number((avg / course.reviews.length).toFixed(1));
		};

		await course?.save();

		const notification = {
			title: 'New Review Received',
			message: `${req.user?.name} has given a review in ${course?.name}`,
		};

		//create a notification

		res.status(200).json({
			success: true,
			course
		});
	} catch (error: any) {
		return next(new ErrorHandler(error.message, 500));
	}
});

//add reply in review
export const addReplyInReview = CatchAsyncErrors(async(req: Request, res: Response, next: NextFunction) => {
	try {
		const {comment, reviewId, courseId} = req.body as IAddReviewData;
		const course = await courseModel.findById(courseId);

		if(!courseId){
			return next(new ErrorHandler('Course not found', 404));
		};

		const review = course?.reviews?.find(
			(rev: any) => rev._id.toString() === reviewId
		);

		if(!review) {
			return next(new ErrorHandler('Review not found', 404));
		};

		const replyData: any = {
			user: req.user,
			comment,
		};

		if(!review.commentReplies){
			review.commentReplies = [];
		};

		review.commentReplies?.push(replyData);

		await course?.save();

		res.status(200).json({
			success: true,
			course
		});
	} catch (error: any) {
		return next(new ErrorHandler(error.message, 500));
	}
});

