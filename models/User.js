import mongoose from "mongoose";

const schema = new mongoose.Schema({
	// any field
	isAdmin: {
		type: Boolean,
		default: false
	},
	cart: {
		type: Array,
		default: []
	}
}, { strict: false, timestamps: true })

export default mongoose.model("User", schema)