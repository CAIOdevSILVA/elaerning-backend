import express from 'express';
import { activateUser, getUserData, loginUser, logoutUser, registrationUser, socialLogin, updateAccessToken, updateUserData } from '../controllers/user.controller';
import { authorizedRoles, isAuthenticated } from '../middleware/auth';

const userRouter = express.Router();

userRouter.post('/registration', registrationUser);
userRouter.post('/activate-user', activateUser);
userRouter.post('/login', loginUser);
userRouter.get('/logout', isAuthenticated, logoutUser);
userRouter.get('/refresh', updateAccessToken)
userRouter.get('/me', isAuthenticated, getUserData);
userRouter.post('/social-auth', socialLogin);
userRouter.put('/update-user-data', isAuthenticated, updateUserData);

export default userRouter;
