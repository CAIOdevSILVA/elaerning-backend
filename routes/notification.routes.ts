import express from 'express';
import { authorizedRoles, isAuthenticated } from '../middleware/auth';
import { getNotifications, updateNotificationStatus } from '../controllers/notification.controller';

export const notificationRouter = express.Router();

notificationRouter.get('/get-all-notifications', isAuthenticated, authorizedRoles('admin'), getNotifications);
notificationRouter.put('/update-notification-status/:id', isAuthenticated, authorizedRoles('admin'), updateNotificationStatus);
