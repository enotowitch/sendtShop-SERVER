// * for eval
import product from "../models/Product.js"
import article from "../models/Article.js" // !!
import user from "../models/User.js"
import order from "../models/Order.js"

// ! addPost
export const addPost = async (req, res) => {

	// type=product/article/comment/review...
	const { type } = req.body

	// save product/article/comment/review...
	const doc = await eval(type)({ ...req.body })
	await doc.save()

	res.json({ ok: true, _id: doc._id.toString() })
}

// ! getAllPosts
export const getAllPosts = async (req, res) => {

	// type=product/article/comment/review...
	// field=tags/likes/...
	const { type, field } = req.body

	let response
	response = await eval(type).find({}) // eg: all products
	if (field) {
		let fieldsArr = []
		response = await eval(type).find({})
		response = response.map(post => post?.[field].map(tag => !fieldsArr.includes(tag) && fieldsArr.push(tag)))
		response = fieldsArr // eg: product.tags (without dups)
	}

	res.json(response) // all product/article/comment/review... || product.tags/article.likes...
}

export const sortPosts = async (req, res) => {

	// type=product/article/comment/review...
	// field=price/title/...
	// sortType=asc/desc/...
	const { type, sortField, sortType } = req.body

	const sorted = await eval(type).find({}).sort({ [sortField]: sortType })
	res.json(sorted)
}

// ! deletePost
export const deletePost = async (req, res) => {

	// type=product/article/comment/review...
	const { type, _id } = req.body

	await eval(type).findOneAndDelete({ _id })

	res.json({ ok: true })
}

// ! fullPost
export const fullPost = async (req, res) => {

	// type=product/article/comment/review...
	const { type, _id } = req.body

	// !! TODO possible probs: if I get order via fullPost it's updated on every visit; order uses updatedAt to show when the track was sent, assuming order is only updated 1 time, when track is sent
	const fullPost = await eval(type).findOneAndUpdate({ _id }, { $inc: { views: 1 } })

	res.json(fullPost)
}

// ! editPost
export const editPost = async (req, res) => {

	// type=product/article/order/comment/review...
	const { type, _id } = req.body

	// edit product/article/comment/review...
	await eval(type).findOneAndUpdate({ _id }, { ...req.body })

	res.json({ ok: true })
}

// ! pullPush
export const pullPush = async (req, res) => {
	// !! for arrays & 
	// !! objects (separate `item` type); on "push" makes: findOneAndUpdate without $push

	const { col, colId = req?.userId, field, item, action, dups = false, pullMode = "all" } = req.body
	// for updating already created fields in collection
	// HOW TO USE:
	// col=user/product/article...
	// colId= userId by default (comes from addUserId middleware) || productId/articleId/...
	// field=cart/like...
	// item: productId/articleId/{}/...
	// action: pull/push/clear/pullPush
	// dups: false by default (allow duplicate items be added to `field`)
	// dups: "TRUE example": duplicate product ids in user cart `field`
	// dups: "FALSE example": only one user id in article like `field`
	// pullMode: all/one; "all" by default (pull all or one item(s) from `field`)

	// examples:
	// eg: user.findOneAndUpdate({ _id: req?.userId }, { $push: { cart: productId } })
	// eg: article.findOneAndUpdate({ _id: articleId }, { $push: { like: userId } })

	// ! PUSH
	if (action === "push") {
		if (typeof item === "object") {
			await eval(col).findOneAndUpdate({ _id: colId }, { [field]: item })
			return // !! mandatory
		}
		if (dups === true) {
			await eval(col).findOneAndUpdate({ _id: colId }, { $push: { [field]: item } })
		}
		if (dups === false) {
			// prevent pushing dups to col field; 
			// eg: don't push prodId to cart if cart already has this prodId
			const foundCol = await eval(col).find({ _id: colId })
			const searchedField = foundCol?.[0][field]
			if (!searchedField?.includes(item)) {
				await eval(col).findOneAndUpdate({ _id: colId }, { $push: { [field]: item } })
			}
		}
	}

	// ! PULL
	if (action === "pull") {
		// ! all: pull all items of one type; eg: [1,2,2,2,3] => all "2" => [1,3]
		if (pullMode === "all") {
			await eval(col).findOneAndUpdate({ _id: colId }, { $pull: { [field]: item } })
		}
		// ! one: pull one item of one type; eg: [1,2,2,2,3] => one "2" => [1,2,2,3]
		if (pullMode === "one") {
			const foundCollection = await eval(col).find({ _id: colId }) // find exact collection
			const withoutOneItem = foundCollection[0]?.[field] // select exact field in collection
			withoutOneItem.splice(withoutOneItem.indexOf(item), 1) // delete one item from field

			await eval(col).findOneAndUpdate(
				{ _id: colId },
				{ $set: { [field]: withoutOneItem } } // replace old field with new field (without one item)
			)
		}
	}
	// ! CLEAR: clear whole field; eg: cart: [1,2,2,2,3] => cart: []
	if (action === "clear") {
		await eval(col).findOneAndUpdate({ _id: colId }, { [field]: [] })
	}
	// ! pullPush
	if (action === "pullPush") {
		// if id exists (pull) / if id NOT exist (push)
		// eg: dislike(pull) / like (push): article.likes
		const foundCol = await eval(col).find({ _id: colId })
		const searchedField = foundCol?.[0][field]
		if (!searchedField?.includes(item)) {
			await eval(col).findOneAndUpdate({ _id: colId }, { $push: { [field]: item } })
			return res.json({ ok: true, action: "push" })
		} else {
			await eval(col).findOneAndUpdate({ _id: colId }, { $pull: { [field]: item } })
			return res.json({ ok: true, action: "pull" })
		}
	}

	res.json({ ok: true })
}
// test commit 2