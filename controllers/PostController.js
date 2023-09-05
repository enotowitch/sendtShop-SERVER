// * for eval
import product from "../models/Product.js"
import article from "../models/Article.js" // !!
import user from "../models/User.js"
import order from "../models/Order.js"
import review from "../models/Review.js"
// other
import about from "../models/About.js"
import terms from "../models/Terms.js"
import privacy from "../models/Privacy.js"
import returns from "../models/Returns.js"

// ! addPost
export const addPost = async (req, res) => {

	// type=product/article/comment/review...
	const { type } = req.body
	const userId = req?.userId
	const user = req.userInfo

	// save product/article/comment/review...
	const doc = await eval(type)({ ...req.body, userId, user })
	await doc.save()

	res.json({ ok: true, _id: doc._id.toString() })
}

// ! test
export const test = async (req, res) => {

	for (let i = 0; i <= 100; i++) {

		const randomNum = Number((Math.random() * i).toFixed(2))
		const cats = ["new", "featured", "hot", "sale"]
		const randomCat = Math.floor(Math.random() * cats.length)

		// ! testProd
		const testProd = { tags: [cats[randomCat], cats?.[randomCat + 1]], characteristicNames: [`test char name ${i}`], characteristicValues: [`test char value ${i}`], informationNames: [`test info name ${i}`], informationValues: [`test info value ${i}`], img: [`https://picsum.photos/800/600?random=${i}`, `https://picsum.photos/800/600?random=${i + 1}`, `https://picsum.photos/800/600?random=${i + 2}`], title: `test prod ${i}`, brand: `test brand ${i}`, price: randomNum, text: `test text ${i}`, custom_field: `test custom field ${i}`, type: `product`, userId: `64da3136ddb6d8c658bc8379` }
		// ? testProd

		const doc = await product({ ...testProd })
		await doc.save()
	}

	res.json({ ok: true })
}

// ! testArticles
export const testArticles = async (req, res) => {

	for (let i = 0; i <= 100; i++) {

		const cats = ["new", "featured", "hot", "sale"]
		const randomCat = Math.floor(Math.random() * cats.length)

		// ! testArticle
		const testArticle = { likes: [], tags: [cats[randomCat], cats?.[randomCat + 1]], title: `test article ${i}`, type: `article`, textEditorValue: "test article text ![](https://media.istockphoto.com/id/1226902990/vector/mega-sale-banner-special-offer-and-sale-shop-now-or-this-weekend-only-up-to-50-or-60-or-70.jpg?s=612x612&w=0&k=20&c=EphmtGwqWwit08k14dSM7X4ALGOB_3vZD_cR5jI623Q=)" }
		// ? testArticle

		const doc = await article({ ...testArticle })
		await doc.save()
	}

	res.json({ ok: true })
}

// ! getAllPosts
export const getAllPosts = async (req, res) => {

	let skipStatusDeletedPosts = { "status": { $ne: "deleted" } }
	// type=product/article/comment/review...
	// field=tags/likes/...
	const { type, field, showDeleted } = req.body

	// !!
	if (showDeleted === true) { // in order I need all products (even with "deleted" status)
		skipStatusDeletedPosts = {} // find all products if showDeleted === true
	}

	let response
	if (!field) {
		response = await eval(type).find(skipStatusDeletedPosts).sort({ createdAt: "desc" }) // eg: all products
	}
	if (field) {
		let fieldsArr = []
		response = await eval(type).find(skipStatusDeletedPosts)
		response = response.map(post => post?.[field]?.map(tag => !fieldsArr.includes(tag) && fieldsArr.push(tag)))
		response = fieldsArr // eg: product.tags (without dups)
	}

	res.json(response) // all product/article/comment/review... || product.tags/article.likes...
}

// ! filterPosts
export const filterPosts = async (req, res) => {

	const { type, filterPostsQuery, skip } = req.body

	let tag, text, sort
	if (filterPostsQuery) { // prevent can not destructure
		({ tag, text, sort } = filterPostsQuery)
	}

	const sortField = sort?.match(/(.+)&(.+)/)?.[1] // eg: price => price&asc
	const sortType = sort?.match(/(.+)&(.+)/)?.[2] // eg: asc => price&asc

	let filtered
	const regExp = { $regex: text?.toString(), $options: 'i' }
	let skipStatusDeletedPosts = { "status": { $ne: "deleted" } }

	if (tag && !text) {
		console.log(111)
		filtered = await eval(type).find({ tags: tag, ...skipStatusDeletedPosts }).skip(skip).limit(12).sort({ [sortField]: sortType })
	}
	if (!tag && text) {
		console.log(222)
		filtered = await eval(type).find({ $or: [{ title: regExp }, { text: regExp }], ...skipStatusDeletedPosts }).skip(skip).limit(12).sort({ [sortField]: sortType })
	}
	if (tag && text) {
		console.log(333)
		filtered = await eval(type).find({ tags: tag, $or: [{ title: regExp }, { text: regExp }], ...skipStatusDeletedPosts }).skip(skip).limit(12).sort({ [sortField]: sortType })
	}
	if (!tag && !text) { // no search = return all posts
		console.log(444)
		filtered = await eval(type).find(skipStatusDeletedPosts).skip(skip).limit(12).sort({ [sortField]: sortType })
	}

	res.json(filtered)
}

// ! deletePost
export const deletePost = async (req, res) => {

	// type=product/article/comment/review...
	const { type, _id } = req.body

	await eval(type).findOneAndDelete({ _id })

	res.json({ ok: true })
}

// ! hidePost
export const hidePost = async (req, res) => {

	// type=product/article/comment/review...
	const { type, _id } = req.body

	await eval(type).findOneAndUpdate({ _id }, { status: "deleted" })

	res.json({ ok: true })
}

// ! unHidePost
export const unHidePost = async (req, res) => {

	// type=product/article/comment/review...
	const { type, _id } = req.body
	await eval(type).findOneAndUpdate({ _id }, { status: "" })
	res.json({ ok: true })
}

// ! fullPost
export const fullPost = async (req, res) => {

	// type=product/article/comment/review...
	const { type, _id } = req.body

	// !! TODO possible probs: if I get order via fullPost it's updated on every visit; order uses updatedAt to show when the track was sent, assuming order is only updated 1 time, when track is sent
	const fullPost = await eval(type).findOneAndUpdate({ _id }, { $inc: { views: 1 } })

	// ! add product/article to viewed
	if (req.userId && (type === "product" || type === "article")) {
		const _user = await user.find({ _id: req.userId })
		const _userViewed = _user?.[0]?.[type + "Viewed"]

		// add product/article to viewed if it's not there yet
		if (!_userViewed?.includes(_id)) {
			// eg:                                                      user: articleViewed/productViewed
			await user.findOneAndUpdate({ _id: req.userId }, { $push: { [type + "Viewed"]: _id } })
		}
	}
	// ? add product/article to viewed

	res.json(fullPost)
}

// ! viewedPosts
export const viewedPosts = async (req, res) => {

	// type=product/article/comment/review...
	const { type } = req.body

	const _user = await user.find({ _id: req.userId })
	// eg:                           user: articleViewed/productViewed
	const _userViewed = _user?.[0]?.[type + "Viewed"]

	let skipStatusDeletedPosts = { "status": { $ne: "deleted" } }
	const viewedPosts = await eval(type).find({ _id: { $in: _userViewed }, ...skipStatusDeletedPosts }).limit(20)

	res.json(viewedPosts)
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
		// ! object, array
		if (typeof item === "object") {
			if (dups === true) { // push
				await eval(col).findOneAndUpdate({ _id: colId }, { $push: { [field]: item } })
				return res.json({ ok: true }) // !! mandatory
			}
			if (dups === false) { // (default) rewrite
				await eval(col).findOneAndUpdate({ _id: colId }, { [field]: item })
				return res.json({ ok: true }) // !! mandatory
			}
		}
		// ? object, array
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
	// ? PUSH

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
	// ? PULL

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

// ! deleteCartProduct
export const deleteCartProduct = async (req, res) => {

	const { product } = req.body

	const { _id, quantity, custom_fields } = product // coming FRONT product
	const frontProd = { _id, quantity, custom_fields }

	const _user = await user.find({ _id: req?.userId })
	const userCart = _user?.[0].cart

	let oneTime = 0

	await userCart.map((prod, ind) => {
		if (oneTime > 0) return // prevent deleting exactly same products (only delete one at a time)
		const { _id, quantity, custom_fields } = prod // DB user.cart product
		const DBprod = { _id, quantity, custom_fields }
		if (JSON.stringify(frontProd) === JSON.stringify(DBprod)) {
			userCart.splice(ind, 1) // delete one product from tempCart
			oneTime += 1
		}
	})

	await user.findOneAndUpdate(
		{ _id: req?.userId },
		{ $set: { cart: userCart } } // replace old cart with new cart (without one product)
	)

	res.json({ ok: true })
}

// ! randomPosts
export const randomPosts = async (req, res) => {

	const { type } = req.body

	let skipStatusDeletedPosts = { "status": { $ne: "deleted" } }
	const posts = await eval(type).find(skipStatusDeletedPosts)
	const randNums = []
	for (let i = 0; i < 19; i++) { // get about 10 rand nums without dups
		const randNum = Math.floor(Math.random() * posts.length)
		!randNums.includes(randNum) && randNums.push(randNum)
	}
	const randomPosts = randNums.map(num => posts[num])

	res.json(randomPosts)
}

// ! hiddenPosts
export const hiddenPosts = async (req, res) => {

	const { type } = req.body
	const hiddenPosts = await eval(type).find({ status: "deleted" })
	res.json(hiddenPosts)
}