// ! for createStripePopup
// * These lines make "require" available
import { createRequire } from "module";
const require = createRequire(import.meta.url);
//
import dotenv from 'dotenv'
dotenv.config()
const stripe = require("stripe")("sk_test_51NnOpJKr9QvcxosECJtxHYmrGiTAktBZQBKmkhgE8VWuhp8ItOhAjXPx9HcMMFqtDVMl9QdUFUdKCNh4Vt61kexe00Eaz2h9bi")
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

	// make user cart without prods that were deleted by admin
	const userCartWithoutDeleted = []
	const allDbProds = await product.find({ status: { $nin: ["hidden", "deleted"] } })
	userCart.map(userCartProd => allDbProds.map(allProd => {
		if (userCartProd._id === String(allProd._id)) {
			userCartWithoutDeleted.push(userCartProd)
		}
	}))

	// fix user cart: delete not existing prods
	await user.findOneAndUpdate({ _id: userId }, { cart: userCartWithoutDeleted })

	let prodIds = [] // prod ids to find in db
	userCartWithoutDeleted?.map(prod => prodIds.push(prod._id))
	const dbProds = await product.find({ _id: { $in: prodIds }, status: { $ne: "deleted" } }) // dbProds but give one prod; and userCart has 2 prods even if it's instance of 1 prod
	const dbProdsWithDups = [] // make so `userCart` and `dbProdsWithDups` have same length; eg: userCart.len(2), dbProds.len(1) = NOTCorrect, dbProdsWithDups.len(2) = Correct
	prodIds?.map(prodId => dbProds?.map(dbProd => prodId === String(dbProd._id) && dbProdsWithDups.push(dbProd)))


	const allProds = []
	userCartWithoutDeleted.map((cartProd, cartProdInd) => {
		let oneProd = {}
		let additionalName = ""
		let additionalPrice = 0
		cartProd.custom_field_names.map(customFieldName => {
			if (cartProd?.[customFieldName] && cartProd?.[customFieldName].includes("{")) { // OBJECT: prevent parsing strings (only fullProdForm selects give obj with {name, price})
				// additionalPrice from DB
				const valueOfCustomField = JSON.parse(cartProd?.[customFieldName]).name // eg: (color): red (looking for red)
				dbProdsWithDups[cartProdInd]?.custom_fields.map(option => {
					let dbAdditaionalPrice
					dbAdditaionalPrice = option.options.find(option => option?.name === valueOfCustomField)?.price
					if (dbAdditaionalPrice) {
						additionalPrice += Number(dbAdditaionalPrice)
						// additionalName
						const name = customFieldName + ": " + JSON.parse(cartProd?.[customFieldName]).name
						additionalName += " " + name + " (" + "+$" + dbAdditaionalPrice + " each" + ")" + ";"
					}
				})
			} else { // STRING: input type text
				// additionalName
				const name = customFieldName + ": " + cartProd?.[customFieldName] + ";"
				additionalName += " " + name
			}
		})
		// dbProdPrice
		const dbProdPrice = dbProdsWithDups[cartProdInd].price
		const finalPrice = (Number(dbProdPrice) + Number(additionalPrice)) * 100
		// dbProdTitle
		const dbProdTitle = dbProdsWithDups[cartProdInd].title
		const finalName = dbProdTitle.toUpperCase() + ": " + additionalName
		// make 1 stripe Prod
		oneProd = { ...oneProd, name: finalName, price: finalPrice.toFixed(0), quantity: Number(cartProd.quantity) }
		allProds.push(oneProd)
	})

	try {
		// if user is redirected to "/verifyOrderToken" page, he gets orderToken, 
		// then client makes app.post("/addOrder") from "/verifyOrderToken" page
		// then if token verified => create order

		const orderToken = await signToken(Date.now().toString()) // gen token, write it to order, only create order if this token not used (prevent order with token copied)

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			mode: "payment",
			line_items: allProds.map(({ name, price, quantity }) => {
				return {
					price_data: {
						currency: "usd",
						product_data: {
							name: name,
						},
						unit_amount: price,
					},
					quantity: quantity,
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
	if (isVerifiedToken) {
		if (cart.length > 0) {
			// if user cart on client loaded create order with order.cart(same as user's for easy show prods to admin, as prods are shown in user's cart)
			let checkTokenExist = await order.find({ token })
			checkTokenExist = checkTokenExist?.[0]?.token
			if (!checkTokenExist) { // ! prevent using same token for order creation: gen token, write it to order, only create order if this token not used (prevent order with token copied)
				let number = await order.find() // order number
				number = number.length + 1
				const doc = await new order({ token, cart, shipping, email, userId: _id.toString(), number })
				await doc.save()
				return res.json({ ok: true, orderId: doc._id.toString() }) // uniq token: create order
			} else {
				return res.json({ ok: false }) // token was copied/order already exists
			}
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