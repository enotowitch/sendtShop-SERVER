// * for eval
import product from "../models/Product.js"

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