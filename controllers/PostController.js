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

// ! addTo
export const addTo = async (req, res) => {

	// place=cart/like/...; id=productId/articleId
	const { place, _id } = req.body

	// edit `place`
	await user.findOneAndUpdate({ _id: req?.userId }, { $push: { [place]: _id } }) // TODO: push / pull...

	res.json({ ok: true })
}