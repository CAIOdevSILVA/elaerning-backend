import { truncate } from 'fs';
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IOrder extends Document {
	courseId: string;
	userId: string;
	payment_info: object;
}

const orderSchema = new Schema<IOrder>({
	courseId: {
		type: String,
		required: true
	},
	userId: {
		type: String,
		requires: true,
	},
	payment_info: {
		type: Object
	}
}, { timestamps: true });

export const orderModel: Model<IOrder> = mongoose.model('Order', orderSchema);
