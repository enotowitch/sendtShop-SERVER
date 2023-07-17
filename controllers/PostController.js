// * for eval
import product from "../models/Product.js"
import article from "../models/Product.js"

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
	const { type, id } = req.body

	await eval(type).findOneAndDelete({ _id: id })

	res.json({ ok: true })
}

// ! fullPost
export const fullPost = async (req, res) => {

	// type=product/article/comment/review...
	const { type, id } = req.body

	const fullPost = await eval(type).find({ _id: id })

	res.json(fullPost[0])
}

// ! editPost
export const editPost = async (req, res) => {

	// type=product/article/comment/review...
	const { type, id } = req.body

	// edit product/article/comment/review...
	await eval(type).findOneAndUpdate({ _id: id }, { ...req.body })

	res.json({ ok: true })
}