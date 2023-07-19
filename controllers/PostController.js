// * for eval
import product from "../models/Product.js"
import article from "../models/Article.js" // !!
import user from "../models/User.js"

// ! addPost
export const addPost = async (req, res) => {

	// type=product/article/comment/review...
	const { type } = req.body

	// save product/article/comment/review...
	const doc = await eval(type)({ ...req.body })
	await doc.save()

	res.json({ ok: true })
}

// ! getAllPosts
export const getAllPosts = async (req, res) => {

	// type=product/article/comment/review...
	const { type } = req.body

	// return all product/article/comment/review...
	const all = await eval(type).find({})

	res.json(all)
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

	const fullPost = await eval(type).find({ _id })

	res.json(fullPost[0])
}

// ! editPost
export const editPost = async (req, res) => {

	// type=product/article/comment/review...
	const { type, _id } = req.body

	// edit product/article/comment/review...
	await eval(type).findOneAndUpdate({ _id }, { ...req.body })

	res.json({ ok: true })
}

// ! pullPush
export const pullPush = async (req, res) => {

	const { col, colId = req?.userId, field, item, action, dups = false } = req.body
	// HOW TO USE:
	// col=user/product/article...
	// colId= userId by default (comes from addUserId middleware) || productId/articleId/...
	// field=cart/like...
	// item: productId/articleId/{}/...
	// action: pull/push
	// dups: false by default (allow duplicate items be added to `field`)
	// dups: "TRUE example": duplicate product ids in user cart `field`
	// dups: "FALSE example": only one user id in article like `field`

	// examples:
	// eg: user.findOneAndUpdate({ _id: req?.userId }, { $push: { cart: productId } })
	// col, field, item
	// eg: article.findOneAndUpdate({ _id: articleId }, { $push: { like: userId } })
	// col, colID, field, item
	if (action === "push") {
		if (dups === true) {
			await eval(col).findOneAndUpdate({ _id: colId }, { $push: { [field]: item } }) // TODO: push / pull...
		}
	}

	res.json({ ok: true })
}