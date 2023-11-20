import express from 'express';
import { isAuthenticated, authorizedRoles } from '../middleware/auth';
import { createLayout, updateLayout } from '../controllers/layout.controller';

const layoutRouter = express.Router();

layoutRouter.post('/create-layout', isAuthenticated, authorizedRoles('admin'), createLayout);
layoutRouter.put('/update-layout', isAuthenticated, authorizedRoles('admin'), updateLayout);

export default layoutRouter;
