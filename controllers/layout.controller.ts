import { Request, Response, NextFunction } from "express";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { layoutModel } from "../models/layout.model";

// create layout
export const createLayout = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { type } = req.body;
			const isTypeExist = await layoutModel.findOne({ type });
			if (isTypeExist) {
				return next(new ErrorHandler(`${type} already exist`, 400));
			}
			if (type === "Banner") {
				const { image, title, subTitle } = req.body;
				const myCloud = await cloudinary.v2.uploader.upload(image, {
					folder: "layout",
				});

				const banner = {
					image: {
						public_id: myCloud.public_id,
						url: myCloud.secure_url,
					},
					title,
					subTitle,
				};

				await layoutModel.create(banner);
			}
			if (type === "FAQ") {
				const { faq } = req.body;
				const faqItems = await Promise.all(
					faq.map(async (item: any) => {
						return {
							question: item.question,
							answer: item.answer,
						};
					})
				);
				await layoutModel.create({ type: "FAQ", faq: faqItems });
			}
			if (type === "Categories") {
				const { categories } = req.body;
				const categoriesItems = await Promise.all(
					categories.map(async (item: any) => {
						return {
							title: item.title,
						};
					})
				);
				await layoutModel.create({
					type: "Categories",
					categories: categoriesItems,
				});
			}

			res.status(201).json({
				success: true,
				message: "Layout created successfully",
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// update layout
export const updateLayout = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { type } = req.body;
			if (type === "Banner") {
				const bannerData: any = await layoutModel.findOne({ type: 'Banner' });
				const { image, title, subTitle } = req.body;
				if(bannerData){
					await cloudinary.v2.uploader.destroy(bannerData.image.public_id);
				};
				const myCloud = await cloudinary.v2.uploader.upload(image, {
					folder: "layout",
				});

				const banner = {
					image: {
						public_id: myCloud.public_id,
						url: myCloud.secure_url,
					},
					title,
					subTitle,
				};

				await layoutModel.findOneAndUpdate(bannerData._id, { banner });
			}
			if (type === "FAQ") {
				const { faq } = req.body;
				const FaqItem = await layoutModel.findOne({ type: 'FAQ' });
				const faqItems = await Promise.all(
					faq.map(async (item: any) => {
						return {
							question: item.question,
							answer: item.answer,
						};
					})
				);
				await layoutModel.findByIdAndUpdate(FaqItem?._id, { type: "FAQ", faq: faqItems });
			}
			if (type === "Categories") {
				const { categories } = req.body;
				const categoriesData = await layoutModel.findOne({ type: 'Categories' });
				const categoriesItems = await Promise.all(
					categories.map(async (item: any) => {
						return {
							title: item.title,
						};
					})
				);
				await layoutModel.findByIdAndUpdate(categoriesData?._id, {
					type: "Categories",
					categories: categoriesItems,
				});
			}

			res.status(201).json({
				success: true,
				message: "Layout Updated successfully",
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);
