import express from 'express';
import { addAnswerInQuestion, addQuestion, addReplyInReview, addReview, editCourse, getAllCourse, getCourseByUser, getSingleCourse, uploadCourse } from '../controllers/course.controller';
import { isAuthenticated, authorizedRoles } from '../middleware/auth';

const courseRouter = express.Router();

courseRouter.post('/create-course', isAuthenticated, authorizedRoles('admin'), uploadCourse);
courseRouter.put('/edit-course/:id', isAuthenticated, authorizedRoles('admin'), editCourse);
courseRouter.get('/get-course/:id', getSingleCourse);
courseRouter.get('/get-courses', getAllCourse);
courseRouter.get('/get-course-content/:id', isAuthenticated,getCourseByUser);
courseRouter.put('/add-question', isAuthenticated,addQuestion);
courseRouter.put('/add-answer', isAuthenticated,addAnswerInQuestion);
courseRouter.put('/add-review/:id', isAuthenticated, addReview);
courseRouter.put('/add-reply', isAuthenticated, authorizedRoles('admin'), addReplyInReview);

export default courseRouter;
