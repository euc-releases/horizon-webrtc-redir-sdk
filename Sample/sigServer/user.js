/*
 * Copyright (c) Omnissa, LLC. All rights reserved.
 * This product is protected by copyright and intellectual property laws in the
 * United States and other countries as well as by international treaties.
 * -- Omnissa Restricted
 */

const MessageType = require("./common/constant");
const User = function (id, ws, userMap) {
	this.id = id;
	this.ws = ws;
	this.userMap = userMap;
};

User.prototype.handleMsg = function(msg) {
	switch(msg.messageType) {
		case MessageType.KEEP_ALIVE:
			this.handleKeepAlive();
			break;
		case MessageType.CALL_CTRL:
			this.handleCallCtrl(msg);
			break;
		case MessageType.LOGIN:
			this.handleLogin(msg);
			break;
		case MessageType.SIGNALING:
			this.handleSignaling(msg);
			break;
		default:
			this.log("received unknow message type: " + msg.messageType);
	}
};

User.prototype.handleSignaling = function(msg) {
	this.log("received signaling message from client: " + msg.userId + ", to: "+ msg.to);
	let receiverId = msg.to;
	let otherUser = this.userMap.get(receiverId);
	if (!otherUser) {
		let errorMsg = "user: " + receiverId + " is not online. Could not forward Message.";
		this.logError(errorMsg);
		let reply = {
			messageType: MessageType.ERROR,
			text: errorMsg
		}
		this.ws.send(JSON.stringify(reply));
		return;
	}

	// Just forward the signaling message to the other side
	msg.from = this.id;
	this.log("Forward signaling message from client: " + msg.userId + ", to: "+ msg.to);
	otherUser.ws.send(JSON.stringify(msg));
};

User.prototype.handleCallCtrl = function(msg) {
	this.log("received Call Control message from client: " + msg.userId + ", to: "+ msg.to);
	let receiverId = msg.to;
	let otherUser = this.userMap.get(receiverId);
	if (!otherUser) {
		let errorMsg = "user: " + receiverId + " is not online. Could not forward Message.";
		this.logError(errorMsg);
		let reply = {
			messageType: MessageType.ERROR,
			text: errorMsg
		}
		this.ws.send(JSON.stringify(reply));
		return;
	}

	// Just forward the Call Control message to the other side
	msg.from = this.id;
	this.log("Forward Call Control message from client: " + msg.userId + ", to: "+ msg.to);
	otherUser.ws.send(JSON.stringify(msg));
};

User.prototype.handleLogin = function(msg) {
	this.log("received login message from client: " + msg.userId);
}

User.prototype.handleKeepAlive = function() {
	this.log("received keep alive from client.");
};

User.prototype.disconnect = function() {
	this.log("diconnect this user.");
	this.ws.close();
	this.userMap.delete(this.id);
};

User.prototype.log = function (s) {
	console.log("User(" + this.id + ") ==> " + s);
};

User.prototype.logError = function (s) {
	console.error("User(" + this.id + ") ==> " + s);
};

module.exports = User;
