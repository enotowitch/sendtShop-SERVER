import UserModel from "../models/User.js"
import jwt from "jsonwebtoken"
import mailer from "../utils/mailer.js"

// ! HELPER FUNCTIONS

async function findUserByEmail(email) {
	let user = await UserModel.find({ email })
	user = user[0]
	return user
}

async function findUserById(userId) {
	let user = await UserModel.find({ _id: userId })
	user = user[0]

	// check if user isAdmin
	let isAdmin
	if (user?.email === process.env.ADMIN_EMAIL || user?.email === process.env.ADMIN_EMAIL2) {
		isAdmin = true
	} else {
		isAdmin = false
	}
	user.isAdmin = isAdmin

	return user
}

async function signToken(userId) {
	return jwt.sign(userId, process.env.JWT)
}

async function regAndReturnUser(email, req) {
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

// ! MAIN FUNCTIONS

// ! loginGoogle
export const loginGoogle = async (req, res) => {

	const { email } = req.body

	const user = await regAndReturnUser(email, req)
	const token = await signToken(user._id.toString()) // make token

	res.json({ ok: true, token, user })
}

// ! autoAuth
export const autoAuth = async (req, res) => {

	const { token } = req.body

	const userId = jwt.verify(token, process.env.JWT)
	const user = await findUserById(userId)

	res.json({ ok: true, user })
}

// ! loginSendEmail
export const loginSendEmail = async (req, res) => {

	const { email } = req.body

	// register user, BUT NOT sending userInfo to client, as user have to click "verify" in email
	const user = await regAndReturnUser(email, req)

	// send token to email: * user gets email, clicks "verify", token written to localStorage, reload page (user authed by autoAuth)
	const token = await signToken(user._id.toString())
	mailer(email, "Confirm Email", `
	<a style="display: inline-flex; align-items: center; border-radius: 20px; padding: 6px 16px; background: #673BD9; color: white; text-decoration: none; font-family: Montserrat" href="${process.env.CLIENT_URL}/verifyToken/${token}">VERIFY EMAIL</a>
	`)

	res.json({ ok: true })
}