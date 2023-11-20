import express from 'express';
import { activateUser, getAllUsers, getUserData, loginUser, logoutUser, registrationUser, socialLogin, updateAccessToken, updatePassword, updateProfilePicture, updateUserData, updateUserRole } from '../controllers/user.controller';
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
userRouter.put('/update-password', isAuthenticated, updatePassword);
userRouter.put('/update-user-avatar', isAuthenticated, updateProfilePicture);
userRouter.get('/get-all-users', isAuthenticated, authorizedRoles('admin'), getAllUsers);
userRouter.put('/update-user-role', isAuthenticated, authorizedRoles('admin'), updateUserRole);

export default userRouter;
