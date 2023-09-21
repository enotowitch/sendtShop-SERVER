// npm i express dotenv mongoose cors nodemon jsonwebtoken nodemailer multer stripe

import express from 'express'
import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'
import cors from 'cors'

const app = express()
app.use(cors()) // enables api queries
app.use(express.json()) // enables req.body
const PORT = process.env.PORT
app.listen(PORT, err => err ? console.log(err) : console.log(`SERVER OK, PORT: ${PORT}`))
mongoose.connect(`mongodb+srv://enotowitch:qwerty123@cluster0.9tnodta.mongodb.net/sendt?retryWrites=true&w=majority`)
	.then(console.log('DB OK')).catch(err => console.log('ERROR', err))

// !! ROUTES
// ! middleware
import { addUserId, addUserInfo, addUserIdOptional, addUserInfoOptional } from "./middleware/addUserInfo.js" // TODO rename

// ! auth
import * as UserController from "./controllers/UserController.js"
app.post("/loginGoogle", UserController.loginGoogle)
app.post("/autoAuth", UserController.autoAuth)
app.post("/loginSendEmail", UserController.loginSendEmail)
// ? auth

// ! posts
import * as PostController from "./controllers/PostController.js"
app.post("/addPost", addUserId, addUserInfo, PostController.addPost)
app.post("/test", PostController.test) // TODO delete
app.post("/testArticles", PostController.testArticles) // TODO delete
app.post("/getAllPosts", PostController.getAllPosts)
app.post("/filterPosts", PostController.filterPosts)
app.post("/likedPosts", addUserId, PostController.likedPosts)
app.post("/deletePost", PostController.deletePost)
app.post("/hidePost", PostController.hidePost)
app.post("/unHidePost", PostController.unHidePost)
app.post("/fullPost", addUserIdOptional, PostController.fullPost)
app.post("/viewedPosts", addUserId, PostController.viewedPosts)
app.post("/editPost", PostController.editPost)
app.post("/pullPush", addUserId, PostController.pullPush)
app.post("/deleteCartProduct", addUserId, PostController.deleteCartProduct)
app.post("/randomPosts", addUserInfoOptional, PostController.randomPosts)
app.post("/hiddenPosts", PostController.hiddenPosts)
app.post("/getActualUserCart", addUserInfo, PostController.getActualUserCart)
// ? posts

// ! order
import * as OrderController from "./controllers/OrderController.js"
app.post("/create-checkout-session", OrderController.createStripePopup)
app.post("/addOrder", addUserInfo, OrderController.addOrder)
app.post("/orderSendEmailTrack", OrderController.orderSendEmailTrack)
// ? order

// ! other
import * as OtherController from "./controllers/OtherController.js"
app.post("/contactUs", OtherController.contactUs)
app.post("/subscribe", OtherController.subscribe)
app.post("/editFooter", OtherController.editFooter)
// ? other
// ?? ROUTES

// ! MULTER
import multer from "multer"
import fs, { existsSync } from "fs"

// Create storage configurations for the productImages folder
const storage1 = multer.diskStorage({
	destination: (req, file, cb) => {
		const folderPath = "upload/productImages"
		if (!existsSync(folderPath)) {
			fs.mkdirSync(folderPath, { recursive: true })
		}
		cb(null, folderPath)
	},
	filename: (req, file, cb) => {
		const uniqueFileName = `${file.originalname.split(".")[0]}${Date.now()}.${file.originalname.split(".").pop()}`
		cb(null, uniqueFileName)
	}
})

// Create storage configurations for the userProductFiles folder
const storage2 = multer.diskStorage({
	destination: (req, file, cb) => {
		const folderPath = "upload/userProductFiles"
		if (!existsSync(folderPath)) {
			fs.mkdirSync(folderPath, { recursive: true })
		}
		cb(null, folderPath)
	},
	filename: (req, file, cb) => {
		const uniqueFileName = `${file.originalname.split(".")[0]}${Date.now()}.${file.originalname.split(".").pop()}`
		cb(null, uniqueFileName)
	}
})

// Create Multer instances with the respective storage configurations
const upload1 = multer({ storage: storage1 })
const upload2 = multer({ storage: storage2 })

app.post("/upload/productImages", upload1.array("anyfile", 99), (req, res) => {
	const fileArr = req.files?.map((file) => `${process.env.SERVER_URL}/upload/productImages/${file.filename}`)
	res.json({ fileArr })
})

app.post("/upload/userProductFiles", upload2.array("anyfile", 99), (req, res) => {
	const fileArr = req.files?.map((file) => `${process.env.SERVER_URL}/upload/userProductFiles/${file.filename}`)
	res.json({ fileArr })
})

app.use("/upload/productImages", express.static("upload/productImages"))
app.use("/upload/userProductFiles", express.static("upload/userProductFiles"))

// ! delete img
app.post("/deleteImg", (req, res) => {
	const { imgName } = req.body
	imgName && unlinkSync(`upload/${imgName}`)
})
// ? MULTER
// test commit
