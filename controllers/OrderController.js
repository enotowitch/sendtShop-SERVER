// ! for createStripePopup
// * These lines make "require" available
import { createRequire } from "module";
const require = createRequire(import.meta.url);
//
import dotenv from 'dotenv'
dotenv.config()
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY)
import { signToken, verifyToken } from "./helperFunctions.js"
// ! for addOrder
import order from "../models/Order.js"

// ! createStripePopup
export const createStripePopup = async (req, res) => {

	console.log(req.body) // TODO change incoming data

	const storeItems = new Map([ // TODO delete FAKE data
		[1, { priceInCents: 10000, name: "Test with random price 1" }],
		[2, { priceInCents: 20000, name: "Test with random price 2" }],
	])

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
			line_items: req.body.items.map(item => {
				const storeItem = storeItems.get(item.id)
				return {
					price_data: {
						currency: "usd",
						product_data: {
							name: storeItem.name,
						},
						unit_amount: storeItem.priceInCents,
					},
					quantity: item.quantity,
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
	const { cart, shipping, email } = req.userInfo[0]

	const isVerifiedToken = await verifyToken(token)
	if (isVerifiedToken) { // TODO: prevent dup orders on page reload if link copied
		if (cart && shipping) {
			// if user cart on client loaded create order with order.cart(same as user's for easy show prods to admin, as prods are shown in user's cart)
			const doc = await new order({ cart, shipping, email })
			await doc.save()
			res.json({ ok: true }) // !! wait till order is created
		}
	}

}