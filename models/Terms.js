import mongoose from "mongoose";

const schema = new mongoose.Schema({
	// any field
	_id: {
		type: String,
		default: "myCustomOneId"
	}
}, { strict: false, timestamps: true })

export default mongoose.model("Terms", schema)