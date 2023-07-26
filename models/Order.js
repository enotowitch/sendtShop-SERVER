import mongoose from "mongoose";

const schema = new mongoose.Schema({
	// any field
	status: {
		type: String,
		default: "pending"
	}
}, { strict: false, timestamps: true })

export default mongoose.model("Order", schema)