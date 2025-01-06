/*
 * Copyright (c) Omnissa, LLC. All rights reserved.
 * This product is protected by copyright and intellectual property laws in the
 * United States and other countries as well as by international treaties.
 * -- Omnissa Restricted
 */

const fs = require("fs");
const https = require("https");
const express = require("express");
const WebSocketServer = require("ws").Server;

const User = require("./user");
const MessageType = require("./common/constant");

/*
 **************************************************
 * Assume the certificate and key files in the folder "certs" that sits
 * next to "sigServer" folder
 **************************************************
 */

let certificate = fs.readFileSync("../certs/cert.pem", "utf8");
let privateKey = fs.readFileSync("../certs/key.pem", "utf8");
let credentials = {key: privateKey, cert: certificate};

const app = express();
const httpsServer = https.createServer(credentials, app);

/**************************************************
 * Feel free to change the port number here
 **************************************************
*/
const port = 8443
httpsServer.listen(port);

console.log("---------- WSS server started ----------");
console.log(`WSS ==> Listening on port ${port}...`);

const wsServer = new WebSocketServer({
    server: httpsServer
});

const userMap = new Map();

wsServer.on("connection", function(ws) {
   console.log("client connected");

   ws.on("message", function incoming(message) {
		let msg;
		try {
			msg = JSON.parse(message);
		} catch (error) {
			console.log(error);
			console.log("WSS ==> Received invailid format of message: " + message);
			return;
		}

      let userId = msg.userId;
      let msgId = msg.id;
		let messageType = msg.messageType;
      console.log("WSS ==> received message from client: " +  userId + ", message type: " + msg.messageType);
		let user = userMap.get(userId);
		if (!user || messageType === MessageType.LOGIN) {
			if (user) {	// replace the old client with new one
				console.log("WSS ==> Duplicated client connected with id: " +  userId + ", disconnect the old one.");
				user.ws.close();
				userMap.delete(userId);
			}

			user = new User(userId, ws, userMap);
			userMap.set(userId, user);
		}
		user.handleMsg(msg);
   });

   ws.on("close", function close() {
      userMap.forEach((userWS, userId) => {
         if (userWS === ws) {
            userMap.delete(userId);
            console.log("WSS ==> client: " + userId + ", disconnected");
         }
      });
   });

   ws.on("error", function error(e) {
      console.error("WSS ==> on Web Socket error:" + e);
   });
});
