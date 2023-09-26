import nodemailer from "nodemailer"

// !! mailer
// * how to setup: 
// https://stackoverflow.com/questions/26948516/nodemailer-invalid-login
// search: Since May 30, 2022, Google no longer supports less secure apps...
// link to app pass: https://myaccount.google.com/u/1/apppasswords?utm_source=google-account&utm_medium=myaccountsecurity&utm_campaign=tsv-settings&rapt=AEjHL4NP7rp6aFinpkeUX9FqAeo9rPdHOL6pER_F6OJTdahdyrq6BIjp94ynspbBnD3WHMKzjFyhk4_GiCoLM2sQV-L8DQsHOw
export default function mailer(email, Subject, html) {
	// create reusable transporter object using the default SMTP transport 
	var transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: process.env.SMTP_PORT,
		secure: true,
		auth: {
			user: process.env.ADMIN_EMAIL, // email address
			pass: process.env.SMTP_APP_PASS, // app password
		},
		tls: {
			ciphers: 'SSLv3',
		},
	});

	// setup e-mail data with unicode symbols 
	var mailOptions = {
		from: process.env.ADMIN_EMAIL, // sender address 
		to: email, // list of receivers 
		subject: Subject, // Subject line 
		html: html // html body 
	};

	// send mail with defined transport object 
	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			return console.log("ERROR----" + error);
		}
		console.log('Message sent: ' + info.response);
	});
}
// ?? mailer

// test 2