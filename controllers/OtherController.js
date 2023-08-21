import ContactUsModel from "../models/ContactUs.js"
import SubscriberModel from "../models/Subscriber.js"
import mailer from "../utils/mailer.js"

// ! contactUs
export const contactUs = async (req, res) => {

	const { email, subject, message } = req.body

	try {
		// ! DB
		const doc = await new ContactUsModel({ ...req.body })
		const saved = await doc.save()
		res.json({ ok: true, msg: "Message received" })

		// ! mailer to user
		mailer(email, "We received your message", `
		<div style="font-size: 22px; margin-bottom: 15px"><b>Thank you</b> for contacting us, we will get back asap!</div>
				<div style="font-size: 18px"><b>Your email: </b>${email}</div>
				<div style="font-size: 18px"><b>Subject: </b>${subject}</div>
				<div style="font-size: 18px"><b>Your message: </b>${message}</div>
			`)
		// ! mailer to admin
		mailer(process.env.ADMIN_EMAIL, `Message from user: ${email}`, `
		<div style="font-size: 22px; margin-bottom: 15px">Message from user: <b>${email}</b></div>
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

	const { email } = req.body

	const find = await SubscriberModel.find({ email })

	// * not found in DB
	if (find.length === 0) {
		// ! DB
		const doc = await new SubscriberModel({ ...req.body })
		doc.save()

		// ! mailer
		mailer(email, "SUBSCRIPTION", `
				<div style="font-size: 22px"><b>Thank you</b> for subscription to our Newsletter!</div>
			`)

		return res.json({ ok: true, msg: "you are subscribed" })
	} else {
		// * found in DB
		return res.json({ ok: false, msg: "already subscribed" })
	}
}
// ? subscribe