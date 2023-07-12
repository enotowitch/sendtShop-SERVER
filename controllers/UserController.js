import UserModel from "../models/User.js"
import jwt from "jsonwebtoken"
import mailer from "../utils/mailer.js"

async function findUserByEmail(email) {
	const user = await UserModel.find({ email })
	return user[0]
}

async function signToken(email) {
	return jwt.sign(email, process.env.JWT)
}

// !! TODO rename
export const addUser = async (req, res) => {

	const { email } = req.body

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

	// make token
	const token = jwt.sign(email, process.env.JWT)

	res.json({ ok: true, token, user })
}

// ! autoAuth
export const autoAuth = async (req, res) => {

	const { token } = req.body
	const email = jwt.verify(token, process.env.JWT)
	const user = await findUserByEmail(email)

	res.json({ ok: true, user })
}

// ! loginSendEmail
export const loginSendEmail = async (req, res) => {

	const { email } = req.body
	const token = await signToken(email)
	console.log(token)

	mailer(email, "Confirm Email", `
	<a href="${process.env.CLIENT_URL}/verifyToken/${token}">Click here to verify email</a>
	`)

	res.json({ ok: true })
}