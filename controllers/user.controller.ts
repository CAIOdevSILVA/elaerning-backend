import { NextFunction, Request, Response } from "express";
import { userModel, IUser } from "../models/user.model";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMailToUser from "../utils/sendMails";
import {
	accessTokenOptions,
	refreshTokenOptions,
	sendToken,
} from "../utils/jwt";
import { redis } from "../utils/redis";
import { getAllUsersService, getUserById, updateUserRoleService } from "../services/user.service";
import cloudinary from "cloudinary";

import dotenv from "dotenv";
dotenv.config();

//Register user
interface IRegisterBody {
	name: string;
	email: string;
	password: string;
	avatar?: string;
}

//Activation token
interface IActivationToken {
	token: string;
	activationCode: string;
}

//Activation User
interface IActivationRequest {
	activation_token: string;
	activation_code: string;
}

//Login User
interface ILoginRequest {
	email: string;
	password: string;
}

//Social Login
interface ISocialLogin {
	name: string;
	email: string;
	avatar?: string;
}

//Update User Data
interface IUpdateUserData {
	name?: string;
	email?: string;
}

//Update password
interface IUpdatePassword {
	oldPassword: string;
	newPassword: string;
}

//Update profile picture
interface IUpdateProfilePicture {
	avatar: string;
}

export const registrationUser = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { name, email, password } = req.body;

			const isEmailExist = await userModel.findOne({ email });
			if (isEmailExist) {
				return next(new ErrorHandler("Email already exist", 400));
			}

			const user: IRegisterBody = {
				name,
				email,
				password,
			};

			const activationToken = createActivationToken(user);
			const activationCode = activationToken.activationCode;

			const data = { user: { name: user.name }, activationCode };
			const html = await ejs.renderFile(
				path.join(__dirname, "../mails/activation-mail.ejs"),
				data
			);

			try {
				await sendMailToUser({
					email: user.email,
					subject: "Activate your account",
					template: "activation-mail.ejs",
					data,
				});

				res.status(201).json({
					success: true,
					message: `Please check yuor email: ${user.email}. To activate your account!`,
					activationToken: activationToken.token,
				});
			} catch (error: any) {
				return next(new ErrorHandler(error.message, 400));
			}
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

//Create a Activation Token
export const createActivationToken = (user: any): IActivationToken => {
	const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

	const token = jwt.sign(
		{
			user,
			activationCode,
		},
		process.env.ACTIVATION_SECRET as Secret,
		{
			expiresIn: "5m",
		}
	);

	return { token, activationCode };
};

//Validate Activation Token
export const activateUser = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { activation_code, activation_token } =
				req.body as IActivationRequest;

			const newUser: { user: IUser; activationCode: string } = jwt.verify(
				activation_token,
				process.env.ACTIVATION_SECRET as string
			) as { user: IUser; activationCode: string };

			if (newUser.activationCode !== activation_code) {
				return next(new ErrorHandler("Invalid activation code", 400));
			}

			const { name, email, password } = newUser.user;

			const existUser = await userModel.findOne({ email });

			if (existUser) {
				return next(new ErrorHandler("Email already exist", 400));
			}

			const user = await userModel.create({
				name,
				email,
				password,
			});

			res.status(201).json({
				success: true,
				message: "User created!",
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

//Login User
export const loginUser = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { email, password } = req.body as ILoginRequest;

			if (!email || !password) {
				return next(new ErrorHandler("Please enter email and password", 400));
			}

			const user = await userModel.findOne({ email }).select("+password");

			if (!user) {
				return next(new ErrorHandler("Invalid email or password", 400));
			}

			const isPasswordMatch = await user.comparePassword(password);
			if (!isPasswordMatch) {
				return next(new ErrorHandler("Invalid email or password", 400));
			}

			sendToken(user, 200, res);
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

//Logout User
export const logoutUser = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			res.cookie("access_token", "", { maxAge: 1 });
			res.cookie("refresh_token", "", { maxAge: 1 });
			const userId = req.user?._id || "";
			redis.del(userId);

			res.status(200).json({
				success: true,
				message: "Logged out successfully",
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

//update access token
export const updateAccessToken = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const referesh_token = req.cookies.refresh_token as string;
			const decoded = jwt.verify(
				referesh_token,
				process.env.REFRESH_TOKEN as string
			) as JwtPayload;

			const message = "Could not refresh token";
			if (!decoded) {
				return next(new ErrorHandler(message, 400));
			}

			const session = await redis.get(decoded.id as string);

			if (!session) {
				return next(new ErrorHandler('Please login to access this resource', 400));
			}

			const user = JSON.parse(session);

			const accessToken = jwt.sign(
				{ id: user._id },
				process.env.ACCESS_TOKEN as string,
				{
					expiresIn: "5m",
				}
			);

			const refreshToken = jwt.sign(
				{ id: user._id },
				process.env.REFRESH_TOKEN as string,
				{
					expiresIn: "3d",
				}
			);

			req.user = user;

			res.cookie("access_token", accessToken, accessTokenOptions);
			res.cookie("refresh_token", refreshToken, refreshTokenOptions);

			await redis.set(user?._id, JSON.stringify(user), 'EX', 604800); //...'EX', 604800 > Significa que esse dado no redis vai expirar('EX') em 7 dias(604800).

			res.status(200).json({
				status: "success",
				accessToken,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

//get user data
export const getUserData = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userId = req.user?._id;
			getUserById(userId, res);
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

//Social login
export const socialLogin = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { email, name, avatar } = req.body as ISocialLogin;
			const user = await userModel.findOne({ email });
			if (!user) {
				const newUser = await userModel.create({ email, name, avatar });
				sendToken(newUser, 200, res);
			} else {
				sendToken(user, 200, res);
			}
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

//Update user data
export const updateUserData = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { name, email } = req.body as IUpdateUserData;
			const userId = req.user?._id;
			const user = await userModel.findById(userId);

			if (email && user) {
				const isEmailExist = await userModel.findOne({ email });
				if (isEmailExist) {
					return next(new ErrorHandler("Email already exist", 400));
				}
				user.email = email;
			}

			if (name && user) {
				user.name = name;
			}

			await user?.save();

			await redis.set(userId, JSON.stringify(user));

			res.status(201).json({
				success: true,
				user,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

//upadate password
export const updatePassword = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { oldPassword, newPassword } = req.body as IUpdatePassword;
			if (!oldPassword || !newPassword) {
				return next(new ErrorHandler("Please enter old and new pasword", 400));
			}

			const user = await userModel.findById(req.user?._id).select("+password");
			if (user?.password === undefined) {
				return next(new ErrorHandler("Invalid user", 400));
			}

			const isPasswordMatch = await user?.comparePassword(oldPassword);
			if (!isPasswordMatch) {
				return next(new ErrorHandler("Invalid old password", 400));
			}

			user.password = newPassword;
			await user.save();

			await redis.set(req.user?._id, JSON.stringify(user));

			res.status(201).json({
				success: true,
				user,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

//update profile picture
export const updateProfilePicture = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { avatar } = req.body as IUpdateProfilePicture;
			const userId = req.user?._id;
			const user = await userModel.findById(userId);

			if (avatar && user) {
				if (user?.avatar.public_id) {
					//Se o usuario ja tiver um avatar, primeiro delete
					await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);

					//depois faça o update do novo avatar
					const myCloud = await cloudinary.v2.uploader.upload(avatar, {
						folder: "avatars",
						width: 150,
					});
					user.avatar = {
						public_id: myCloud.public_id,
						url: myCloud.secure_url,
					};

				} else {
					const myCloud = await cloudinary.v2.uploader.upload(avatar, {
						folder: "avatars",
						width: 150,
					});
					user.avatar = {
						public_id: myCloud.public_id,
						url: myCloud.secure_url,
					};
				};
			};

			await user?.save();
			await redis.set(userId, JSON.stringify(user));

			res.status(200).json({
				success: true,
				user
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

//get all users --only for admin
export const getAllUsers = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
	try {
		getAllUsersService(res);
	} catch (error: any) {
		return next(new ErrorHandler(error.message, 500));
	}
});

// update user role --only for admin
export const updateUserRole = CatchAsyncErrors(async(req: Request, res: Response, next: NextFunction) => {
	try {
		const { id, role } = req.body;
		updateUserRoleService(res, id, role);
	}catch (error: any) {
		return next(new ErrorHandler(error.message, 400));
	}
});

// delete user --only for admin
export const deleteUser = CatchAsyncErrors(async(req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = req.params;
		const user = await userModel.findById(id);

		if(!user){
			return next(new ErrorHandler('User not found', 404));
		};

		await user.deleteOne({ id });

		await redis.del(id);

		res.status(200).json({
			success: true,
			message: 'User deleted successfully'
		})

	} catch (error: any) {
		return next(new ErrorHandler(error.message, 400));
	}
});
