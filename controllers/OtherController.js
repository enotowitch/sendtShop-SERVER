import ContactUsModel from "../models/ContactUs.js"
import SubscriberModel from "../models/Subscriber.js"
import mailer from "../utils/mailer.js"
// other
import about from "../models/About.js"
import terms from "../models/Terms.js"
import privacy from "../models/Privacy.js"
import returns from "../models/Returns.js"

// ! editFooter
export const editFooter = async (req, res) => {

	// type=about/terms/privacy/returns/...
	const { type } = req.body

	// create (if not created): about us/terms and conds/privacy/ policy/return policy/...
	const find = await eval(type).findById("myCustomOneId")
	if (!find) {
		const doc = await eval(type)({})
		await doc.save()
	}

	// update: about us/terms and conds/privacy/ policy/return policy/...
	await eval(type).findOneAndUpdate({ _id: "myCustomOneId" }, { ...req.body })

	res.json({ ok: true })
}
// ? editFooter

// ! contactUs
export const contactUs = async (req, res) => {

	const { email, subject, message, orderId } = req.body

	try {
		// ! DB
		const doc = await new ContactUsModel({ ...req.body })
		const saved = await doc.save()
		res.json({ ok: true, msg: "Message received" })

		// ! mailer to user
		mailer(email, "We received your message", `
		<div style="font-size: 22px; margin-bottom: 15px"><b>Thank you</b> for contacting us, we will get back asap!</div>
				<div style="font-size: 18px"><b>Order id: </b>${orderId}</div>
				<div style="font-size: 18px"><b>Your email: </b>${email}</div>
				<div style="font-size: 18px"><b>Subject: </b>${subject}</div>
				<div style="font-size: 18px"><b>Your message: </b>${message}</div>
			`)
		// ! mailer to admin
		mailer(process.env.ADMIN_EMAIL, `Message from user: ${email}`, `
		<div style="font-size: 22px; margin-bottom: 15px">Message from user: <b>${email}</b></div>
				<div style="font-size: 18px"><b>Order id: </b>${orderId}</div>
				<div style="font-size: 18px"><b>User email: </b>${email}</div>
				<div style="font-size: 18px"><b>Subject: </b>${subject}</div>
				<div style="font-size: 18px"><b>User message: </b>${message}</div>
			`)


	} catch (error) {
		console.log(error)
	}
}
// ? contactUs

// ! subscribe
export const subscribe = async (req, res) => {

	const { email, checkIfSubscribed } = req.body

	const find = await SubscriberModel.find({ email })

	// * found in DB => return
	if (find.length > 0) {
		return res.json({ ok: false, msg: "already subscribed" })
	}

	if (checkIfSubscribed) return // if just check => return, don't write new sub

	// * not found in DB
	if (find.length === 0) {
		// ! DB
		const doc = await new SubscriberModel({ email })
		doc.save()

		// ! mailer
		mailer(email, "SUBSCRIPTION", `
				<div style="font-size: 22px"><b>Thank you</b> for subscription to our Newsletter!</div>
			`)

		res.json({ ok: true, msg: "you are subscribed" })
	}
}
// ? subscribe