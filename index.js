// npm i express dotenv mongoose cors nodemon jsonwebtoken nodemailer multer

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
// ! auth
import * as UserController from "./controllers/UserController.js"
app.post("/loginGoogle", UserController.loginGoogle)
app.post("/autoAuth", UserController.autoAuth)
app.post("/loginSendEmail", UserController.loginSendEmail)
// ? auth

// ! posts
import * as PostController from "./controllers/PostController.js"
app.post("/addPost", PostController.addPost)
app.post("/getAllPosts", PostController.getAllPosts)
app.post("/deletePost", PostController.deletePost)
// ? posts
// ?? ROUTES

// ! MULTER
import multer from 'multer'
import fs, { existsSync } from "fs"

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

app.post("/upload", upload.single("image"), (req, res) => {
	res.json({
		url: `${process.env.SERVER_URL}/upload/${req.file.originalname}`
	}
	)
})

app.use("/upload", express.static("upload"))
// ? MULTER
