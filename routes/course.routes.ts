import express from 'express';
import { editCourse, getAllCourse, getSingleCourse, uploadCourse } from '../controllers/course.controller';
import { isAuthenticated, authorizedRoles } from '../middleware/auth';

const courseRouter = express.Router();

courseRouter.post('/create-course', isAuthenticated, authorizedRoles('admin'), uploadCourse);
courseRouter.put('/edit-course/:id', isAuthenticated, authorizedRoles('admin'), editCourse);
courseRouter.get('/get-course/:id', getSingleCourse);
courseRouter.get('/get-courses', getAllCourse);

export default courseRouter;
