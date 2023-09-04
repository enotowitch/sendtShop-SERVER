import UserModel from "../models/User.js"
import jwt from "jsonwebtoken"

export const findUserByEmail = async (email) => {
	let user = await UserModel.find({ email })
	user = user[0]
	return user
}

export const findUserById = async (userId) => {
	let user = await UserModel.find({ _id: userId })
	user = user[0]

	// check if user isAdmin
	let isAdmin
	if (user?.email === process.env.ADMIN_EMAIL || user?.email === process.env.ADMIN_EMAIL2 || user?.email === process.env.ADMIN_EMAIL3) {
		isAdmin = true
	} else {
		isAdmin = false
	}
	user && (user.isAdmin = isAdmin)

	return user
}

export const signToken = async (whatToSign) => { // userId/someString/...
	return jwt.sign(whatToSign, process.env.JWT)
}

export const verifyToken = async (token) => {
	return jwt.verify(token, process.env.JWT)
}

export const regAndReturnUser = async (email, req) => {
	// check if user exists
	const userExist = (await UserModel.find({ email })).length

	// add user to DB
	let user // pass user info to client 
	if (!userExist) {
		const doc = await new UserModel({ ...req.body })
		user = await doc.save()
	} else { // user do exist
		user = await findUserByEmail(email)
	}

	return user
}