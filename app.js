#!/usr/bin/node

/** */
/** Dependencies */
var express = require('express');
var http = require('http');
var bodyparser = require('body-parser');
var fs = require('fs');
var jsonfile = require('jsonfile');
const bcrypt = require('bcrypt');

const speakeasy = require('speakeasy');

var secret = speakeasy.generateSecret();
var QRCode = require('qrcode');

/** Stores users as JSON */
var userfile = "users.txt";

/** Initialize express.js and its templates */
var app = express();
app.use(bodyparser.urlencoded({ extended: true }));
app.set('views', './views');
app.set('view engine', 'pug');

/** Initialize the Web Server */
http.createServer(app).listen("8080", function () {
	console.log("Web Server is listening on port 8080");
});

/** Default Page
		Renders template from view/login.pug
 */
app.get('/', function(req, res) {
	res.render('login');
});

/** Checks credentials when POST to /login-check
		Parses JSON file for usernames
		Compares post data with stored data
 */
app.post('/login-check', function(req, res) {

/** Load User "database" */

	jsonfile.readFile(userfile, function(er, data) {

/** Returns filtered object.
		Should return exactly one object when username and password match an entry.
 */

		var found = data.filter(function(item){
			return item.name == req.body.name;
		});

		if(found.length==0){
			res.send("Login failed because of wrong password or non-existing account.");
		}

		else{
			bcrypt.compare(req.body.password, found[0].password, function(err, result){
				if(result){
					if(found[0].QR == 'no'){
						res.send("Login successful!");
					} else {
						var verified = speakeasy.totp.verify({ secret: found[0].QR,
							encoding: 'base32',
							token: req.body.token });
						if(verified){
							res.send("Login successful!");
						} else {
							res.send("Login failed because of wrong password or non-existing account or bad token.");
						}
					}
				} else {
					res.send("Login failed because of wrong password or non-existing account or bad token.");
				}
			})
		}

// 		var found = data.filter(function(item) {
// 				bcrypt.compare(req.body.password, item.password, function(err, result){
// 					if(result) {
// 						if(item.name == req.body.name){
// 							console.log("working");
// 							res.send("Login successful!");
// 						}
// 					} else if(err){
// 						res.send("bruh");
// 					} else {
// 						res.send("Login failed because of wrong password or non-existing account.");
// 					}
// 				})
// 				}
// 			);
			
 	});
 });

	
/** Checks if the filtered object is exactly one.
		Displays success if it is (because username and password matched)
		Displays failure if any value other than zero
 */
		// if (Object.keys(found).length == 1) {
		// 	res.send("Login successful!")
		// }
		// else {
		// 	res.send("Login failed because of wrong password or non-existing account.")
		// }
		// check for non-existing user

/** New user page. Renders template from views/newuser.pug */
app.get('/add-users', function(req, res) {
	res.render('newuser');
});

/** Current users page.
 		Reads userfile "database".
		Renders template from views/users.pug by passing the users object
 */
app.get('/users', function(req, res) {
	jsonfile.readFile(userfile, function(err, obj){
		if (err) throw err;
		console.log(obj);
		res.render('users', { users: obj });
	});
});

/** Add users page.
 		Reads userfile "database".
		Appends JSON object with POST data to the old userfile object.
		Writes new object to the userfile.
 */

app.post('/adduser', function(req, res) {
// storing users in file
		bcrypt.hash(req.body.password, 8, function(err, hash) {
			if(req.body.qrCode == "on"){
				var userdata = { name: req.body.name, password: hash, twofactor: "enabled", QR: secret.base32};
				
				jsonfile.readFile(userfile, function(er, data) {
					data.push(userdata);
					QRCode.toDataURL(secret.otpauth_url, function(err, data_url){
						user_temp = secret.base32;
						console.log(data_url)
						jsonfile.writeFile(userfile, data, (err) => {
					res.send('successfully registered new user...<br>'
							+ '<a href="/users">Back to User List</a> <img src="' + data_url + '">');
					});
					})
				});
			} else {
				var userdata = { name: req.body.name, password: hash, twofactor: "disabled", QR: 'no'};
				
				jsonfile.readFile(userfile, function(er, data) {
					data.push(userdata);
					QRCode.toDataURL(secret.otpauth_url, function(err, data_url){
						user_temp = secret.base32;
						console.log(data_url)
						jsonfile.writeFile(userfile, data, (err) => {
					res.send('successfully registered new user...<br>'
							+ '<a href="/users">Back to User List</a>');
					});
					})
				});
			}
		})

});
