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
import { addUserId, addUserInfo } from "./middleware/addUserInfo.js" // TODO rename

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
app.post("/getAllPosts", PostController.getAllPosts)
app.post("/filterPosts", PostController.filterPosts)
app.post("/deletePost", PostController.deletePost)
app.post("/fullPost", PostController.fullPost)
app.post("/editPost", PostController.editPost)
app.post("/pullPush", addUserId, PostController.pullPush)
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
import multer from 'multer'
import fs, { existsSync, unlinkSync } from "fs"

const storage = multer.diskStorage({
	"destination": (req, file, cb) => {
		if (!existsSync("upload")) {
			fs.mkdirSync("upload")
		}
		cb(null, "upload")
	},
	"filename": (req, file, cb) => {
		cb(null, file.originalname)
	}
})

const upload = multer({ storage })

app.post("/upload", upload.array("image", 99), (req, res) => {
	const imgArr = req.files?.map(file => `${process.env.SERVER_URL}/upload/${file.originalname}`)
	res.json({ imgArr })
})

app.use("/upload", express.static("upload"))

// ! delete img
app.post("/deleteImg", (req, res) => {
	const { imgName } = req.body
	imgName && unlinkSync(`upload/${imgName}`)
})
// ? MULTER
