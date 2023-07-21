import jwt from "jsonwebtoken"
import UserModel from "../models/User.js"

// * add userId to every req
// must be before Controller function
// eg: app.post("/addPost", addUserId, PostController.addPost)

export const addUserId = async (req, res, next) => {
	try {
		const token = req.headers.authorization
		// !!
		if (token) {
			const decoded = jwt.verify(token, process.env.JWT)
			req.userId = decoded
			next()
		} else {
			res.json() // ??
		}

	} catch (err) {
		res.json(undefined) // ??
		console.log(err)
	}
}

export const addUserInfo = async (req, res, next) => {
	try {
		const token = req.headers.authorization
		// !!
		if (token) {
			const decoded = jwt.verify(token, process.env.JWT)
			const userId = decoded
			const userInfo = await UserModel.find({ _id: userId })
			req.userInfo = userInfo[0] // !!
			next()
		} else {
			res.json() // ??
		}

	} catch (err) {
		res.json(undefined) // ??
		console.log(err)
	}
}