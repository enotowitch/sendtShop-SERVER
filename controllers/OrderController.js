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

// ! shipstation
export const shipstation = async (req, res) => {

  // Define the XML content for your page
  const xmlContent = `
  <?xml version="1.0" encoding="utf-8"?>
  <Orders pages="1">
	<Order>
	  <OrderID><![CDATA[123456]]></OrderID>
	  <OrderNumber><![CDATA[ABC123]]></OrderNumber>
	  <OrderDate>10/18/2019 21:56 PM</OrderDate>
	  <OrderStatus><![CDATA[paid]]></OrderStatus>
	  <LastModified>12/8/2011 12:56 PM</LastModified>
	  <ShippingMethod><![CDATA[USPSPriorityMail]]></ShippingMethod>
	  <PaymentMethod><![CDATA[Credit Card]]></PaymentMethod>
	  <CurrencyCode>EUR</CurrencyCode> 
	  <OrderTotal>123.45</OrderTotal>
	  <TaxAmount>0.00</TaxAmount>
	  <ShippingAmount>4.50</ShippingAmount>
	  <CustomerNotes><![CDATA[Please make sure it gets here by Dec. 22nd!]]></CustomerNotes>
	  <InternalNotes><![CDATA[Ship by December 18th via Priority Mail.]]></InternalNotes>
	  <Gift>false</Gift>
	  <GiftMessage></GiftMessage>
	  <CustomField1></CustomField1>
	  <CustomField2></CustomField2>
	  <CustomField3></CustomField3>
	  <Customer>
		<CustomerCode><![CDATA[customer@mystore.com]]></CustomerCode>
		<BillTo>
		  <Name><![CDATA[The President]]></Name>
		  <Company><![CDATA[US Govt]]></Company>
		  <Phone><![CDATA[512-555-5555]]></Phone>
		  <Email><![CDATA[customer@mystore.com]]></Email>
		</BillTo>
		<ShipTo>
		  <Name><![CDATA[The President]]></Name>
		  <Company><![CDATA[US Govt]]></Company>
		  <Address1><![CDATA[1600 Pennsylvania Ave]]></Address1>
		  <Address2></Address2>
		  <City><![CDATA[Washington]]></City>
		  <State><![CDATA[DC]]></State>
		  <PostalCode><![CDATA[20500]]></PostalCode>
		  <Country><![CDATA[US]]></Country>
		  <Phone><![CDATA[512-555-5555]]></Phone>
		</ShipTo>
	  </Customer>
	  <Items>
		<Item>
		  <SKU><![CDATA[FD88821]]></SKU>
		  <Name><![CDATA[My Product Name]]></Name>
		  <ImageUrl><![CDATA[http://www.mystore.com/products/12345.jpg]]></ImageUrl>
		  <Weight>8</Weight>
		  <WeightUnits>Ounces</WeightUnits>
		  <Quantity>2</Quantity>
		  <UnitPrice>13.99</UnitPrice>
		  <Location><![CDATA[A1-B2]]></Location>
		  <Options>
			<Option>
			  <Name><![CDATA[Size]]></Name>
			  <Value><![CDATA[Large]]></Value>
			  <Weight>10</Weight>
			</Option>
			<Option>
			  <Name><![CDATA[Color]]></Name>
			  <Value><![CDATA[Green]]></Value>
			  <Weight>5</Weight>
			</Option>
		  </Options>
		</Item>
		<Item>
		  <SKU></SKU>
		  <Name><![CDATA[$10 OFF]]></Name>
		  <Quantity>1</Quantity>
		  <UnitPrice>-10.00</UnitPrice>
		  <Adjustment>true</Adjustment>
		</Item>
	  </Items>
	</Order>
  </Orders>
  `;

  // Set the Content-Type header to indicate that the response is in XML format
  res.set('Content-Type', 'application/xml');

  // Send the entire XML page as the response
  res.status(200).send(xmlContent);
}