import mongoose from "mongoose";

const schema = new mongoose.Schema({
	// any field
}, { strict: false, timestamps: true })

export default mongoose.model("ContactUs", schema)