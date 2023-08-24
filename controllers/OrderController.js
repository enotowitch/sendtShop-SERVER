// ! for createStripePopup
// * These lines make "require" available
import { createRequire } from "module";
const require = createRequire(import.meta.url);
//
import dotenv from 'dotenv'
dotenv.config()
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY)
import { signToken, verifyToken } from "./helperFunctions.js"
import user from "../models/User.js"
import product from "../models/Product.js"
// ! for addOrder
import order from "../models/Order.js"
import mailer from "../utils/mailer.js";

// ! createStripePopup
export const createStripePopup = async (req, res) => {

	const { userId } = req.body // req.userId brakes all
	const _user = await user.find({ _id: userId })
	const userCart = _user?.[0]?.cart

	const frontCustomFields = []
	userCart?.map(prod => prod.custom_field_names?.map(fieldName => frontCustomFields.push({ name: fieldName, option: JSON.parse(prod[fieldName]).name })))

	// TODO cur. works for 2 diff prods.
	let prodIds = []
	let prodQuantity = []

	userCart?.map(prod => {
		prodIds.push(prod._id)
		prodQuantity.push(prod.quantity)
	})

	const DBProds = await product.find({ _id: { $in: prodIds } })

	const prices = []
	const titles = []

	DBProds?.map(DBProd => {
		let additionalPrice = 0
		let additionalOptionNames = ""
		let price = 0
		let title = ""

		DBProd.custom_fields?.map(dbCustomField => {
			frontCustomFields.map(frontCustomField => frontCustomField.name === dbCustomField.name && dbCustomField.options?.map(dbCustomFieldOption => {
				if (dbCustomFieldOption) {
					if (dbCustomFieldOption.name === frontCustomField.option) {
						additionalPrice += Number(dbCustomFieldOption.price)
						additionalOptionNames += " " + dbCustomFieldOption.name
					}
				}
			})
			)
			price = (Number(DBProd.price) + Number(additionalPrice)) * 100
			title = DBProd.title + additionalOptionNames
		})
		prices.push(price)
		titles.push(title)
	})

	try {

		// TODO ??? if `session.payment_status = ok` then create order
		// TODO write same HOW IT WORKS for autoAuth
		// if user is redirected to "/verifyOrderToken" page, he gets orderToken, 
		// then client makes app.post("/addOrder") from "/verifyOrderToken" page
		// then if token verified => create order

		const orderToken = await signToken("somethingRandomIfThisVerifiesEverythingIsOk")

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			mode: "payment",
			line_items: titles.map((title, ind) => {
				return {
					price_data: {
						currency: "usd",
						product_data: {
							name: title,
						},
						unit_amount: prices[ind],
					},
					quantity: prodQuantity[ind],
				}
			}),
			success_url: `${process.env.CLIENT_URL}/verifyOrderToken/${orderToken}`,
			cancel_url: `${process.env.CLIENT_URL}/paymentCancel`,
		})

		res.json({ url: session.url })
	} catch (e) {
		res.status(500).json({ error: e.message })
	}
}

// ! addOrder
export const addOrder = async (req, res) => {

	// verify orderToken
	const { token } = req.body
	const { cart, shipping, email, _id } = req.userInfo // !!

	const isVerifiedToken = await verifyToken(token)
	if (isVerifiedToken) { // TODO: prevent dup orders on page reload if link copied
		if (cart && shipping) {
			// if user cart on client loaded create order with order.cart(same as user's for easy show prods to admin, as prods are shown in user's cart)
			const doc = await new order({ cart, shipping, email, userId: _id.toString() })
			await doc.save()
			res.json({ ok: true }) // !! wait till order is created
		}
	}

}

// ! orderSendEmailTrack
export const orderSendEmailTrack = async (req, res) => {

	const { email, track } = req.body // user email

	mailer(email, "Track delivery link", `
	<div style="margin-bottom: 15px;">Thank you for the order! Your track delivery link - ${track}</div>
	<a style="display: inline-flex; align-items: center; border-radius: 20px; padding: 6px 16px; background: #673BD9; color: white; text-decoration: none; font-family: Montserrat" href="${track}">TRACK DELIVERY</a>
	`)

	res.json({ ok: true })

}