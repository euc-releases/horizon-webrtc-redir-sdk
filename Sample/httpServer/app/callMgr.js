/*
 * Copyright (c) Omnissa, LLC. All rights reserved.
 * This product is protected by copyright and intellectual property laws in the
 * United States and other countries as well as by international treaties.
 * -- Omnissa Restricted
 */


import Utils from "./utils.js";
let MsgType = window.commonMsgType;

export const SessionStatus = {
   IDLE: 0,
   STARTING: 1,
   STARTED: 2,
   ENDING: 3
};

export const CallMgr = function() {
   this.id = "WebRTCRedirAppCallMgr";
   this.ws = null;
   this.getStatPoll = null;
};

const spliceSDP = function(origSDP) {
   // add "mainAudio-- mainAudio" and "mainVideo-- mainVideo"
   var lines = origSDP.split('\n');
   const audLine = "mainAudio-- mainAudio-";
   const vidLine = "mainVideo-- mainVideo-";
   var audTrue = true;

   for(var i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.indexOf("m=") === 0 && line.includes("audio")) {
         audTrue = true;
      } else if (line.indexOf("m=") === 0 && line.includes("video")) {
         audTrue = false;
      } else if (line.indexOf("a=") === 0 && line.includes("msid:")) {
         var ret = "";
         const index = line.indexOf("msid:");

         var beforeSubstring = line.substring(0, index + 5);
         var afterSubstring = line.substring(index + 7);

         if (audTrue) { 
            ret = beforeSubstring + audLine + afterSubstring;
         } else {
            ret = beforeSubstring + vidLine + afterSubstring;
         }
         lines[i] = ret;
      }
   }

   return lines.join('\n');
};

CallMgr.init = function (app) {
   CallMgr.log("Initialize CallMgr ");
   CallMgr.app = app;
   CallMgr.ui = app.ui;
   CallMgr.SDK = app.HorizonRedirSDK;
   CallMgr.WebRTCRedirApp = window.WebRTCRedirApp;
};

CallMgr.login = function(userId, numOfCalls) {
   CallMgr.userId = userId;
   CallMgr.loggedIn = true;

   CallMgr.calls = new Array();
   for (let i = 0; i < numOfCalls; i++) {
      CallMgr.addCall(i);
   }

   if (!CallMgr.ui.defaultAudioOutput) {
      CallMgr.ui.getDeviceList(true/*init*/);
   }

   CallMgr.initWS();
}

CallMgr.getUserMedia = async function(id, constraint) {
   let stream;
   if (!CallMgr.app.isAgentConnected || !constraint) {
      return stream;
   }
   try {
      if (!CallMgr.WebRTCRedirApp.disableMultiAudio) {
         let callConfig = CallMgr.SDK.getCallConfig(id);
         stream = await CallMgr.SDK.getUserMediaEx(constraint, callConfig)
      } else {
         stream = await CallMgr.SDK.getUserMedia(constraint);
      }
   } catch (error) {
      CallMgr.logError(`Failed to get local media: ${id} error:${error}`);
      CallMgr.ui.showError(id, error);
   }
   return stream;
}

CallMgr.addCall = function(id) {
   CallMgr.calls[id] = {};
   CallMgr.calls[id].status = SessionStatus.IDLE;
};

CallMgr.makeCall = async function (calleeId, id) {
   CallMgr.log("Start Making Call to: " + calleeId);
   if (!CallMgr.calls[id]) {
      CallMgr.addCall(id);
   }
   CallMgr.calls[id].status = SessionStatus.STARTING;

   CallMgr.ui.onHavingCall(calleeId, id);

   let callInfo = {
      callId: CallMgr.userId + Utils.getRandomNumber().toString(),
      from: CallMgr.userId,
      peer: calleeId,
   };
   CallMgr.calls[id].callInfo = callInfo;

   let _pc = CallMgr.createPeerConnection(id);

   const audioTransceiver = _pc.addTransceiver("audio", { direction: 'inactive' });
   const videoTransceiver = _pc.addTransceiver("video", { direction: 'inactive' });

   CallMgr.calls[id].audioTransceiver = audioTransceiver;
   CallMgr.calls[id].videoTransceiver = videoTransceiver;

   let audio_device = this.ui.currentSelectedAudioInput(id);
   let audioConstraint = audio_device ? { audio: { deviceId : audio_device}, video : false } : undefined;

   let video_device = this.ui.currentSelectedVideoInput(id);
   let videoConstraint = video_device ? { audio: false, video : { deviceId : video_device } } : undefined;

   let _audioMediaStream = await CallMgr.getUserMedia(id, audioConstraint);
   let _videoMediaStream = await CallMgr.getUserMedia(id, videoConstraint);

   CallMgr.calls[id].audioStream = _audioMediaStream;
   CallMgr.calls[id].videoStream = _videoMediaStream;
   CallMgr.calls[id].pc = _pc;

   audioTransceiver.direction = "sendrecv";
   let audioTrack = _audioMediaStream ? _audioMediaStream.getAudioTracks()[0] : undefined;
   if (audioTrack) {
      audioTrack.enabled = true;
      audioTransceiver.sender.replaceTrack(audioTrack);
   }

   videoTransceiver.direction = "sendrecv";
   let videoTrack = _videoMediaStream ? _videoMediaStream.getVideoTracks()[0] : undefined;
   if (videoTrack) {
      videoTrack.enabled = true;
      videoTransceiver.sender.replaceTrack(videoTrack);
   } else {
      videoTransceiver.sender.replaceTrack(null);
   }

   let _offer;
   try {
      _offer = await _pc.createOffer();
      await _pc.setLocalDescription(_offer);
   } catch(error) {
      CallMgr.logError("Failed to deal with local description: " + error);
      return;
   }

   const updatedSDP = spliceSDP(_offer.sdp);
   

   let msg = {
      callType: id,
      messageType: MsgType.SIGNALING,
      type: "offer",
      sdp: updatedSDP,
   };
   CallMgr.log("Sending out offer to: " + calleeId);
   CallMgr.sendMsg(msg, CallMgr.calls[id].callInfo);
   CallMgr.ui.onCallStarted(id);
};


CallMgr.answerCall = async function(id) {
   let calleeId = CallMgr.calls[id].callInfo ? CallMgr.calls[id].callInfo.peer : null;
   if (!calleeId) {
      CallMgr.logError("No incoming call to be answer.");
      CallMgr.endCall(true, id);
      return;
   }
   CallMgr.calls[id].status = SessionStatus.STARTING;
   CallMgr.log("Answering call from: " + calleeId);
   
   CallMgr.ui.onHavingCall(calleeId, id);

   let _pc = CallMgr.createPeerConnection(id);

   let audio_device = this.ui.currentSelectedAudioInput(id);
   let audioConstraint = audio_device ? { audio: { deviceId : audio_device}, video : false } : undefined;

   let video_device = this.ui.currentSelectedVideoInput(id);
   let videoConstraint = video_device ? { audio: false, video : { deviceId : video_device } } : undefined;   

   let _audioMediaStream = await CallMgr.getUserMedia(id, audioConstraint);
   let _videoMediaStream = await CallMgr.getUserMedia(id, videoConstraint);
   if (!_audioMediaStream && !_videoMediaStream) {
      CallMgr.rejectCall(id);
      return;
   }

   CallMgr.calls[id].audioStream = _audioMediaStream;
   CallMgr.calls[id].videoStream = _videoMediaStream;
   CallMgr.calls[id].pc = _pc;
   CallMgr.calls[id].audioTransceiver = null;
   CallMgr.calls[id].videoTransceiver = null;

   let audioTrack = _audioMediaStream ? _audioMediaStream.getAudioTracks()[0] : undefined;
   let videoTrack = _videoMediaStream ? _videoMediaStream.getVideoTracks()[0] : undefined;

   let _remoteDescription = {
      type: "offer",
      sdp: CallMgr.calls[id].callInfo.remoteSDP
   };

   try {
      await _pc.setRemoteDescription(_remoteDescription);
      _pc.hasRemoteDescription = true;
      CallMgr.calls[id].audioTransceiver = _pc.getTransceivers().filter((transceiver)=> {
         return transceiver.receiver.track && transceiver.receiver.track.kind == 'audio';
      })[0];
      CallMgr.calls[id].videoTransceiver = _pc.getTransceivers().filter((transceiver)=> {
         return transceiver.receiver.track && transceiver.receiver.track.kind == 'video';
      })[0];
      _pc.sendLocalIceCandidates();
   } catch(error) {
      CallMgr.logError("Failed to set remote description: " + error);
      CallMgr.rejectCall(id);
      return;
   }

   if (!CallMgr.calls[id].audioTransceiver) {
      CallMgr.logError("Invalid audio transceiver");

   } else {
      CallMgr.log("audio transceiver is not null after setremotedescription ontrack fired");
      CallMgr.calls[id].audioTransceiver.direction = 'sendrecv';
      CallMgr.calls[id].audioTransceiver.sender.replaceTrack(audioTrack ? audioTrack : null);
   }

   if (!CallMgr.calls[id].videoTransceiver) {
      CallMgr.logError("Invalid video transceiver");

   } else {
      CallMgr.log("video transceiver is not null after setremotedescription ontrack fired");
      CallMgr.calls[id].videoTransceiver.direction = 'sendrecv';
      CallMgr.calls[id].videoTransceiver.sender.replaceTrack(videoTrack ? videoTrack : null);
   }

   let _answer;
   try {
      _answer = await _pc.createAnswer();
      await _pc.setLocalDescription(_answer);
   } catch(error) {
      CallMgr.logError("Failed to deal with local description: " + error);
      CallMgr.rejectCall(id);
      return;
   }

   const updatedSDP = spliceSDP(_answer.sdp);

   let reply = {
      callType: id,
      messageType: MsgType.SIGNALING,
      type: "answer",
      sdp: updatedSDP
   };
   CallMgr.log("Sending out answer to: " + CallMgr.calls[id].callInfo.peer);
   CallMgr.sendMsg(reply, CallMgr.calls[id].callInfo);
   CallMgr.ui.updateUIStatus(id);
};

CallMgr.rejectCall = function(id) {
   let calleeId = CallMgr.calls[id].callInfo ? CallMgr.calls[id].callInfo.peer : null;
   if (!calleeId) {
      CallMgr.logError("No incoming call to be rejected.");
      CallMgr.endCall(true, id);
      return;
   }
   CallMgr.log("Rejecting call from: " + calleeId);
   document.getElementById("incomingDialog").style.display = "none";

   let reply = {
      callType: id,
      messageType: MsgType.CALL_CTRL,
      action: "reject",
      reason: "BUSY",
   }
   CallMgr.log("Reject incoming call from:" + calleeId + ", current status: " + CallMgr.status);
   CallMgr.sendMsg(reply, CallMgr.calls[id].callInfo);
   CallMgr.endCall(true, id);
};

CallMgr.endCall = function (needToSendMsg, id) {
   CallMgr.calls[id].status = SessionStatus.ENDING;
   if (needToSendMsg) {
      let msg = {
         callType: id,
         messageType: MsgType.CALL_CTRL,
         action: "endCall"
      };
      CallMgr.sendMsg(msg, CallMgr.calls[id].callInfo);
   }

   CallMgr.log("Ending Call......");
   Utils.stopStream(CallMgr.calls[id].audioStream);
   Utils.stopStream(CallMgr.calls[id].videoStream);
   CallMgr.teardownScreenShare(false, id);
   CallMgr.calls[id].pc && CallMgr.calls[id].pc.close();
   CallMgr.calls[id].status = SessionStatus.IDLE;
   CallMgr.calls[id].audioStream = null;
   CallMgr.calls[id].videoStream = null;
   CallMgr.calls[id].audioTransceiver = null;
   CallMgr.calls[id].videoTransceiver = null;
   CallMgr.calls[id].pc = null;
   if (CallMgr.getStatPoll) {
      clearInterval(CallMgr.getStatPoll)
   }
   CallMgr.calls[id].callInfo = null;
   CallMgr.calls[id].hasRemoteDescription = false;
   CallMgr.ui.onCallEnded(id);
   CallMgr.log("Call was Ended.");
   
};

CallMgr.audio_track = function(id) {
   let audioTrack = CallMgr.calls && CallMgr.calls[id]
                    && CallMgr.calls[id].audioStream
                    && CallMgr.calls[id].audioStream.getAudioTracks()[0];
   return audioTrack;
}

CallMgr.muteAudio = function(isMute, id) {
   CallMgr.log((isMute ? "Mute" : "Unmute") + " local audio.");
   try {
      let audioTrack = CallMgr.calls[id].audioStream.getAudioTracks()[0];
      audioTrack.enabled = !isMute;
   } catch(e) {
      CallMgr.logError("Failed to " + (isMute ? "mute " : "unmute ") + "local audio.");
   }
};

CallMgr.video_track = function(id) {
   let videoTrack =  CallMgr.calls && CallMgr.calls[id]
                     && CallMgr.calls[id].videoStream
                     && CallMgr.calls[id].videoStream.getVideoTracks()[0];
   return videoTrack;
}

CallMgr.muteVideo = function(isMute, id) {
   CallMgr.log((isMute ? "Mute" : "Unmute") + " local video.");
   try {
      let videoTrack = CallMgr.calls[id].videoStream.getVideoTracks()[0];
      videoTrack.enabled = !isMute;
   } catch(e) {
      CallMgr.logError("Failed to " + (isMute ? "mute " : "unmute ") + "local video.");
   }
};

CallMgr.updateAudioStatus = async function(id) {
   let audioStream;
   let deviceId = CallMgr.ui.currentSelectedAudioInput(id);
   if (   CallMgr.calls[id].status !== SessionStatus.IDLE
       && deviceId) {
      let audioConstraint = {audio: {deviceId: deviceId}, video: false};         
      audioStream = await CallMgr.getUserMedia(id, audioConstraint);
   }
   let prevStream = CallMgr.calls[id].audioStream;
   if (prevStream && prevStream.getAudioTracks()[0]) {
      prevStream.getAudioTracks()[0].enabled = false;
   }
   Utils.stopStream(prevStream);
   CallMgr.calls[id].audioStream = audioStream;
   let audioTransceiver = CallMgr.calls[id].audioTransceiver;
   if (audioTransceiver) {
      let audeoTrack = audioStream ? audioStream.getAudioTracks()[0] : null;
      if (audeoTrack) {
         audeoTrack.enabled = true;
         audioTransceiver.sender.replaceTrack(audeoTrack);
      } else {
         audioTransceiver.sender.replaceTrack(null);
      }
      audioTransceiver.direction = "sendrecv";
   }
};

CallMgr.updateVideoStatus = async function(id) {
   let videoStream;
   let deviceId = CallMgr.ui.currentSelectedVideoInput(id);
   if (   CallMgr.calls[id].status !== SessionStatus.IDLE
       && deviceId) {
      let videoConstraint = {video: {deviceId: deviceId}, audio: false};         
      videoStream = await CallMgr.getUserMedia(id, videoConstraint);
   }
   let prevStream = CallMgr.calls[id].videoStream;
   if (prevStream && prevStream.getVideoTracks()[0]) {
      prevStream.getVideoTracks()[0].enabled = false;
   }
   Utils.stopStream(prevStream);
   CallMgr.calls[id].videoStream = videoStream;
   let videoTransceiver = CallMgr.calls[id].videoTransceiver;
   if (videoTransceiver) {
      videoTransceiver.direction = "sendrecv";
      let videoTrack = videoStream ? videoStream.getVideoTracks()[0] : null;
      if (videoTrack) {
         videoTrack.enabled = true;
         videoTransceiver.sender.replaceTrack(videoTrack);
      } else {
         videoTransceiver.sender.replaceTrack(null);
      }
      videoTransceiver.direction = "sendrecv";
   }
};


CallMgr.initWS = async function () {
   CallMgr.log("Connecting to Call Server...... set up WSS connection");
   try {
      CallMgr.ws = new WebSocket(this.app.callServerUrl);
   } catch (e) {
      CallMgr.log("Failed to set up WSS");
      return;
   }

   CallMgr.ws.onmessage = function(event) {
      CallMgr.log("Received message: " + event.data);
      let msg = JSON.parse(event.data);

      switch(msg.messageType) {
         case MsgType.CALL_CTRL:
            CallMgr.handleCallCtrl(msg);
            break;
         case MsgType.SIGNALING:
            CallMgr.handleSDPMsg(msg)
            break;
         case MsgType.ERROR:
            CallMgr.handleWSErrorMsg(msg);
            break;
         default:
            CallMgr.logError("Received unknow message type: " + msg.messageType);
      }
   };

   CallMgr.ws.onerror = function(error) {
      // TODO::Handle error
   };

   CallMgr.ws.onclose = function(closeEvent) {
      CallMgr.ui.onLogout();
   };

   CallMgr.ws.onopen = function() {
      let loginMsg = {
         messageType: MsgType.LOGIN
      };
      CallMgr.sendMsg(loginMsg);
      CallMgr.ui.onLogin();
   };
};

CallMgr.handleCallCtrl = function(msg) {
   CallMgr.log("Received call control message from: " + msg.userId + ", action: " + msg.action);
   let callId = msg.callId;
   let callType = msg.callType;

   if (!CallMgr.calls[callType] || callId !== CallMgr.calls[callType].callInfo.callId || !msg.action) {
      CallMgr.log("Call Id is not matched or invalid action. Ignore this message.");
      return;
   }
   
   switch(msg.action) {
      case "reject":
         CallMgr.onCallRejected(msg, callType);
         break;
      case "endCall":
         CallMgr.endCall(false, callType);
         break;
      case "teardownScreenShare":
         CallMgr.teardownScreenShare(false, callType);
         break;
      default:
         CallMgr.log("Unknown action: " + msg.action + ", ignore.");
   }
};

CallMgr.handleSDPMsg = function(msg) {
   CallMgr.log("Received SDP msg from: " + msg.userId + ", type: " + msg.type);
   let callType = msg.callType;
   switch(msg.type) {
      case "offer":
         CallMgr.handleOffer(msg, callType);
         break;
      case "answer":
         CallMgr.handleAnswer(msg, callType);
         break;
      case "iceCandidate":
         CallMgr.handleIceCandidate(msg, callType);
         break;
      default:
         CallMgr.logError("Received unknow SDP type: " + msg.type);
   }
};

CallMgr.handleOffer = function(msg, id) {
   if (!CallMgr.calls[id]) {
      CallMgr.addCall(id);
      if (!CallMgr.ui.callUI[id]) {
         CallMgr.ui.addUpToCall(id);
      }
   }
   if (CallMgr.calls[id].status !== SessionStatus.IDLE && !msg.isShare) {
      let reply = {
         callType: msg.callType,
         messageType: MsgType.CALL_CTRL,
         action: "reject",
         reason: "BUSY",
         to: msg.userId
      }
      CallMgr.log("Reject incoming call from:" + msg.userId + ", current status: " + CallMgr.status);
      CallMgr.sendMsg(reply);
      return;
   }

   if (msg.isShare) {
      CallMgr.handleScreenShareOffer(msg, id);
      return;
   }

   let callInfo = {
      callId: msg.callId,
      peer: msg.userId,
      remoteSDP: msg.sdp,
      sdpType: "offer"
   };
   CallMgr.calls[id].callInfo = callInfo;
   CallMgr.ui.incomingCall(id, msg.userId);
};

CallMgr.handleAnswer = function(msg, id) {
   let callId = msg.callId;
   if (callId !== CallMgr.calls[id].callInfo.callId) {
      CallMgr.logError("Received callid: " + callId + ", not matched local callid: " + CallMgr.calls[id].callInfo.callId)
      return;
   }

   let _remoteDescription = {
      type: "answer",
      sdp: msg.sdp
   };
   if (msg.isShare) {
      CallMgr.calls[id].sharePC.setRemoteDescription(_remoteDescription);
      CallMgr.calls[id].sharePC.hasRemoteDescription = true;
      CallMgr.calls[id].sharePC.sendLocalIceCandidates();
   } else {
      CallMgr.calls[id].pc.setRemoteDescription(_remoteDescription);
      CallMgr.calls[id].pc.hasRemoteDescription = true;
      CallMgr.calls[id].pc.sendLocalIceCandidates();
   }
};


CallMgr.handleScreenShareOffer = async function(msg, id) {
   CallMgr.log("Receiving screen share from" + CallMgr.calls[id].callInfo.peer);

   let _pc = CallMgr.createPeerConnection(id);

   CallMgr.calls[id].sharePC = _pc;
   _pc.isScreenShare = true;

   let _remoteDescription = {
      type: "offer",
      sdp: msg.sdp
   };

   try {
      await _pc.setRemoteDescription(_remoteDescription);
      _pc.hasRemoteDescription = true;
      _pc.sendLocalIceCandidates();
   } catch(error) {
      CallMgr.logError("Failed to set remote description: " + error);
      CallMgr.teardownScreenShare(true, id);
      return;
   }
   let _answer;
   try {
      _answer = await _pc.createAnswer();
      await _pc.setLocalDescription(_answer);
   } catch(error) {
      CallMgr.logError("Failed to deal with local description: " + error);
      CallMgr.teardownScreenShare(true, id);
      return;
   }

   const updatedSDP = spliceSDP(_answer.sdp);

   let reply = {
      messageType: MsgType.SIGNALING,
      type: "answer",
      sdp: updatedSDP,
      isShare: true,
      callType: id
   };
   CallMgr.log("Sending out answer to: " + CallMgr.calls[id].callInfo.peer);
   CallMgr.sendMsg(reply, CallMgr.calls[id].callInfo);
};

CallMgr.handleIceCandidate = async function(msg, id) {
   let callId = msg.callId;
   if (callId !== CallMgr.calls[id].callInfo.callId) {
      CallMgr.logError("Received callid: " + callId + ", not matched local callid: " + CallMgr.calls[id].callInfo.callId)
      return;
   }
   try {
      let _candidate = new RTCIceCandidate(msg.candidate);
      if (!msg.isShare) {
         await CallMgr.calls[id].pc.addIceCandidate(_candidate);
      } else {
         await CallMgr.calls[id].sharePC.addIceCandidate(_candidate);
      }
    } catch (error) {
      CallMgr.log("Failed to add one iceCandidate from peer side. That might be OK")
    }
};

CallMgr.teardownScreenShare = function(needToSendMsg, id) {
   if (CallMgr.calls[id].sharePC == null) {
      return;
   }

   if (needToSendMsg) {
      let msg = {
         callType: id,
         messageType: MsgType.CALL_CTRL,
         action: "teardownScreenShare",
         to: CallMgr.calls[id].callInfo.peer
      };
      CallMgr.sendMsg(msg, CallMgr.calls[id].callInfo);
   }

   CallMgr.calls[id].sharePC.close();
   Utils.stopStream(CallMgr.calls[id].shareMediaStream);
   CallMgr.ui.resetScreenShareUI(id);
};


CallMgr.handleWSErrorMsg = function(msg) {
   CallMgr.log("Received error msg: " + msg.text);
   // We have to disconnect instead of endCall as there could be multiple calls going on now
   CallMgr.disconnect();
};

CallMgr.onCallRejected = function(msg, id) {
   CallMgr.endCall(true, id);
};

CallMgr.createPeerConnection = function(id) {
   let pc = null;
   
   /**************************************************************************
    *  This is just a turn server sample, better to use your own turn server.
    **************************************************************************
    */
   let config = {
      iceServers: [{
         urls: [ "stun:ws-turn2.xirsys.com" ]
      }, {
         username: "p6nZxzPrXbUvO_l1btEDzhw7v5ubmnyoYFZWVA3YNhjnrGo7skykkIRKWDfAt9gkAAAAAGHorfViZW5ydWlzaGU=",
         credential: "a7596482-7988-11ec-8a20-0242ac140004",
         urls: [
             "turn:ws-turn2.xirsys.com:80?transport=udp",
             "turn:ws-turn2.xirsys.com:3478?transport=udp",
             "turn:ws-turn2.xirsys.com:80?transport=tcp",
             "turn:ws-turn2.xirsys.com:3478?transport=tcp",
             "turns:ws-turn2.xirsys.com:443?transport=tcp",
             "turns:ws-turn2.xirsys.com:5349?transport=tcp"
         ]
      }]
   };
   let callConfig = CallMgr.SDK.getCallConfig(id);
   if (CallMgr.app.isAgentConnected) {
      if (!CallMgr.WebRTCRedirApp.disableMultiAudio) {
         pc = CallMgr.SDK.newPeerConnectionEx(config, {}, callConfig);
      } else {
         pc = CallMgr.SDK.newPeerConnection(config, {});
      }
      
   } else {
      pc = new RTCPeerConnection(config);
   }
   pc.hasRemoteDescription = false;

   pc.ontrack = function(event) {
      CallMgr.log("peerconnect ontrack event triggered......");
      let stream = event.streams && event.streams[0];
      let audioTrack = stream.getAudioTracks()[0];
      let videoTrack = stream.getVideoTracks()[0];

      if (videoTrack) {
         if (pc.isScreenShare) {
            CallMgr.ui.onRemoteShareStream(stream, id);
            CallMgr.log("peerconnect ontrack received screenshare transceiver");
         } else {
            CallMgr.ui.onRemoteVideoStream(stream, id);
            CallMgr.log("peerconnect ontrack received video transceiver");
         }
      }
      if (audioTrack) {
         CallMgr.ui.onRemoteAudioStream(stream, id);
         CallMgr.log("peerconnect ontrack received audio transceiver");
      }
      CallMgr.getStatPoll = setInterval(function(){
         pc.getStats()
      }, 10000)
   };

   pc.onaddstream = function(event) {
      CallMgr.log("peerconnection onaddstream...... ignore for unified-plan");
   };

   pc.onaddtrack = function(event) {
      CallMgr.log("peerconnection onaddtrack is called");
   };

   pc.onnegotiationneeded = (evt) => {
      CallMgr.log("peerconnection onnegotiationneeded......");
   };

   pc.ontransceivers = (evt) => {
      CallMgr.log("peerconnection ontransceivers....");
   }

   pc.onicecandidate = (evt) => {
      CallMgr.log("peerconnection onicecandidate......");
      if (!pc.localCandidates) {
         pc.localCandidates = [];
      }
      if (evt.candidate) {
         CallMgr.log("peerconnection onicecandidate.");
         let msg = {
            callType: id,
            messageType: MsgType.SIGNALING,
            type: "iceCandidate",
            candidate: evt.candidate.toJSON ? evt.candidate.toJSON() : evt.candidate,
            isShare: pc.isScreenShare
         };
         pc.localCandidates.push(msg)
      }
      
      if (pc.hasRemoteDescription) {
         // immeidately send the new and all the history to peer
         pc.sendLocalIceCandidates();
      }
   }

   pc.sendLocalIceCandidates = () => {
      if (pc.localCandidates) {
         pc.localCandidates.forEach(function(msg) {
            CallMgr.sendMsg(msg, CallMgr.calls[id].callInfo);
         });
         pc.localCandidates = [];
      }
   }

   pc.onsignalingstatechange = (evt) => {
      CallMgr.log("peerconnection onsignalingstatechange: " + pc.signalingState);
   };

   pc.oniceconnectionstatechange = (evt) => {
      CallMgr.log("peerconnection oniceconnectionstatechange......");
      if (pc.iceConnectionState === "connected") {
         CallMgr.ui.onCallConnected(id);
      }
   };

   pc.onicegatheringstatechange = (evt) => {
      CallMgr.log("peerconnection onicegatheringstatechange: " + pc.iceGatheringState);
   };

   pc.onconnectionstatechange = (evt) => {
      CallMgr.log("peerconnection onconnectionstatechange: " + pc.connectionState);
   };
   return pc;
};


CallMgr.disconnect = function(id) {
   CallMgr.log("Disconnecting with Call server......");
   for(var id = 0; id < CallMgr.calls.length; id++) {
      if (CallMgr.calls[id].callInfo || CallMgr.calls[id].status !== SessionStatus.IDLE) {
         CallMgr.endCall(true, id);
      }
   }

   CallMgr.loggedIn = false;
   CallMgr.ws.close();
};


CallMgr.startScreenShare = async function(id) {
   CallMgr.log("Start screen share");
   if (!CallMgr.calls[id].callInfo) {
      CallMgr.error("Trying to start a screenshare and there is no call");
   }
   let peerId = CallMgr.calls[id].callInfo.peer;

   let _pc = CallMgr.createPeerConnection(id);

   const shareTransceiver = _pc.addTransceiver("video", { direction: 'inactive' });
   CallMgr.shareTransceiver = shareTransceiver;

   let _shareMediaStream = null;
   let constraint = {
      video: {
         width: { max: 1280 },
         height: {max: 720 },
         frameRate: 10
      }
   };
   try {
      if (CallMgr.app.isAgentConnected) {
         let screenInfo  = await CallMgr.SDK.getScreensInfo();
         if (screenInfo.length === 0 ) {
            CallMgr.logError("Failed to get local screen information.");
            return;
         }
         // skip the screen selectting step to make the sample app easier
         CallMgr.SDK.onScreenSelected(screenInfo[0].id);

         let callConfig = CallMgr.SDK.getCallConfig(id);
         if (!CallMgr.WebRTCRedirApp.disableMultiAudio) {
            _shareMediaStream = await CallMgr.SDK.getDisplayMediaEx(constraint, callConfig);
         } else {
            _shareMediaStream = await CallMgr.SDK.getDisplayMedia(constraint);
         }
         
      } else {
         _shareMediaStream = await navigator.mediaDevices.getDisplayMedia(constraint);
      }
   } catch(error) {
      CallMgr.logError("Failed to get local screen media stream: " + error);
      return;
   }

   CallMgr.calls[id].shareMediaStream = _shareMediaStream;
   CallMgr.calls[id].sharePC = _pc;
   _pc.isScreenShare = true;

   let shareTrack = _shareMediaStream.getVideoTracks()[0];
   
   shareTransceiver.direction = "sendrecv";
   shareTrack.enabled = true;
   shareTransceiver.sender.replaceTrack(shareTrack);
   shareTransceiver.direction = "sendrecv";

   let _offer;
   try {
      _offer = await _pc.createOffer();
      await _pc.setLocalDescription(_offer);
   } catch(error) {
      CallMgr.logError("Failed to deal with local description: " + error);
      return;
   }

   const updatedSDP = spliceSDP(_offer.sdp);

   let msg = {
      callType: id,
      messageType: MsgType.SIGNALING,
      type: "offer",
      sdp: updatedSDP,
      isShare: true
   };
   CallMgr.log("Sending out screen share offer to: " + peerId);
   CallMgr.sendMsg(msg, CallMgr.calls[id].callInfo);
};

CallMgr.sendMsg = function(msgObj, callInfo) {
   msgObj.userId = CallMgr.userId;
   if (callInfo) {
      if (callInfo.peer) {
         msgObj.to = callInfo.peer;
      }
      if (callInfo.callId) {
         msgObj.callId = callInfo.callId;
      }
   }

   CallMgr.ws.send(JSON.stringify(msgObj));
};

CallMgr.log = function(text) {
   Utils.log("CallMgr", text);
};

CallMgr.logWarn = function(text) {
   Utils.logWarn("CallMgr", text);
};

CallMgr.logError = function(text) {
   Utils.logError("CallMgr", text);
};