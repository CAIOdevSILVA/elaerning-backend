import express from 'express';
import { authorizedRoles, isAuthenticated } from '../middleware/auth';
import { getUsersAnalytics } from '../controllers/analytics.controller';

const analyticsRouter = express.Router();

analyticsRouter.get('/get-users-analytics', isAuthenticated, authorizedRoles('admin'), getUsersAnalytics);

export default analyticsRouter;

