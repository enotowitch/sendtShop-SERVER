import jwt from "jsonwebtoken"
import mailer from "../utils/mailer.js"
import { findUserById, signToken, regAndReturnUser, verifyToken } from "./helperFunctions.js"

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

	const userId = await verifyToken(token)
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
	mailer(email, "Please Confirm Your Email", `
	<a style="display: inline-flex; align-items: center; border-radius: 20px; padding: 6px 16px; background: #673BD9; color: white; text-decoration: none; font-family: Montserrat" href="${process.env.CLIENT_URL}/verifyLoginToken/${token}">VERIFY EMAIL</a>
	`)

	res.json({ ok: true })
}