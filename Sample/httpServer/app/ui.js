/*
 * Copyright (c) Omnissa, LLC. All rights reserved.
 * This product is protected by copyright and intellectual property laws in the
 * United States and other countries as well as by international treaties.
 * -- Omnissa Restricted
 */

import Utils from "./utils.js";
import { CallMgr, SessionStatus } from "./callMgr.js";

const UI = function () {
   this.id = "WebRTCRedirAppUI";
};
UI.init = function(max_numof_call) {
   // VM Agent connection status
   this.agentConnectionLabel = document.getElementById("agentConnectionStatus");
   this.callUI = new Array();

   this.nextCallId = 0;
   this.maxNumOfCalls = max_numof_call;

   this.WebRTCRedirApp = window.WebRTCRedirApp;

   // Horizon Agent connection status
   this.WebRTCRedirApp.isAgentConnected = false;
   this.WebRTCRedirApp.disableMultiAudio = true;

   this.generateCallUI(this.nextCallId++);
   this.loginButton = document.getElementById("login0");
   this.loginButton.onclick = () => {
      if (!CallMgr.loggedIn) {
         UI.login();
      } else {
         UI.logout();
      }
   }

   this.addCallButton = document.getElementById("addCall");
   this.addCallButton.onclick = () => {
      UI.addCall();
   }
   CallMgr.init(window.WebRTCRedirApp);
   this.updateUIStatus();
};

UI.generateCallUI = function(id) {
   if (this.callUI[id]) {
      console.error("The callUI already exists for id: " + id);
      return;
   }

   const callUI = {};
   this.callUI[id] = callUI;

   // generate elements
   const callsDiv = document.getElementById("calls");
   const callDiv = document.createElement("div");
   callDiv.id = "call" + id;
   callsDiv.appendChild(callDiv);

   const meetingInfoDiv = document.createElement('div');
   meetingInfoDiv.id = 'meetingInfo' + id;
   meetingInfoDiv.style.alignContent = 'center';
   meetingInfoDiv.style.whiteSpace = 'nowrap';

   const tableElement = document.createElement('table');
   tableElement.id = 'infoTable' + id;
   tableElement.class = 'infoTable';
   tableElement.setAttribute('border', '1');
   tableElement.setAttribute('align','center');
   tableElement.style.width = '800px';
   tableElement.classList.add('center-align');

   const tableRow = document.createElement('tr');
   tableRow.setAttribute('align', 'center');

   // Row 0
   const userInfoCell = document.createElement('td');
   userInfoCell.setAttribute('width', '30%');
   userInfoCell.textContent = 'User Info';

   const deviceInfoCell = document.createElement('td');
   deviceInfoCell.setAttribute('width', '50%');
   deviceInfoCell.textContent = 'Device Info';

   const selfViewCell = document.createElement('td');
   selfViewCell.setAttribute('width', '20%');
   selfViewCell.textContent = 'Self View';

   tableRow.appendChild(userInfoCell);
   tableRow.appendChild(deviceInfoCell);
   tableRow.appendChild(selfViewCell);
   tableElement.appendChild(tableRow);

   // Row 1
   const inputRow = document.createElement('tr');

   const inputCell = document.createElement('td');
   if (inputCell) {
      if (id == 0) {
         const usernameInput = document.createElement('input');
         usernameInput.id = 'userName';
         usernameInput.type = 'text';
         usernameInput.value = 'alice';

         const loginButton = document.createElement('button');
         loginButton.id = 'login' + id;
         loginButton.textContent = 'Login';

         const tokenLabel = document.createElement('label');
         tokenLabel.textContent = 'Token(optional): ';
         const tokenInput = document.createElement('input');
         tokenInput.id = 'sessionToken' + id;
         tokenInput.type = 'text';
         tokenInput.value = '';

         inputCell.appendChild(document.createTextNode('Username:'));
         inputCell.appendChild(usernameInput);
         inputCell.appendChild(loginButton);
         inputCell.appendChild(document.createElement('br'));
         inputCell.appendChild(tokenLabel);
         inputCell.appendChild(tokenInput);
      } else {
         const loginText = document.createElement('div');
         loginText.innerHTML = 'Use first call button to login';
         loginText.id = 'loginText' + id;

         inputCell.appendChild(loginText);
      }

      const callIDText = document.createElement('div')
      callIDText.innerHTML = 'this is call# ' + id;
      callIDText.id = 'callIDText' + id;

      inputCell.appendChild(callIDText);
   }

   const selectCell = document.createElement('td');
   if (selectCell) {
      const selectTable = document.createElement('table');
      if (selectTable) {
         selectTable.setAttribute('align', 'left');
         // Audio Input
         const audioInputRow = document.createElement('tr');
         {
            const audioInputCheckCell = document.createElement('td');
               const audioInputCheck = document.createElement('input');
               audioInputCheck.onclick = () => {
                  UI.updateUIStatus(id);
                  CallMgr.updateAudioStatus(id);
               }
               audioInputCheck.type = 'checkbox';
               audioInputCheck.id = 'audioInputCheckList' + id;
               audioInputCheck.checked = true;
            audioInputCheckCell.appendChild(audioInputCheck);

            // Audio Input Label with check box.
            const audioInputLabelCell = document.createElement('td');
               const audioInputLable = document.createElement('label');
               audioInputLable.innerHTML = '<b>Audio Input:</b>';
               audioInputLable.htmlfor = audioInputCheck.id;
            audioInputLabelCell.appendChild(audioInputLable);

            // Audio Input Devices List
            const audioInputSelectCell = document.createElement('td');
               audioInputSelectCell.setAttribute('colspan', '2');
               const audioInputSelect = document.createElement('select');
               audioInputSelect.id = 'audioInputList' + id;
               audioInputSelect.style.width = '400px';
            audioInputSelectCell.appendChild(audioInputSelect);

            audioInputRow.appendChild(audioInputCheckCell);
            audioInputRow.appendChild(audioInputLabelCell);
            audioInputRow.appendChild(audioInputSelectCell);
         }

         // Audio Output
         const audioOutputRow = document.createElement('tr');
         {
            // Audio Output Label
            const audioOutputLabelCell = document.createElement('td');
            audioOutputLabelCell.innerHTML = '<b>Audio Output:</b>';

            // Audio Output DeviceList
            const audioOutputSelectCell = document.createElement('td');
               const audioOutputSelect = document.createElement('select');
               audioOutputSelect.id = 'audioOutputList' + id;
               audioOutputSelect.style.width = '400px';
            audioOutputSelectCell.appendChild(audioOutputSelect);
            audioOutputSelectCell.setAttribute('colspan', '2');

            audioOutputRow.appendChild(document.createElement('td'));   // Dummy cell to align with others.
            audioOutputRow.appendChild(audioOutputLabelCell);
            audioOutputRow.appendChild(audioOutputSelectCell);
         }

         // Video Input
         const videoInputRow = document.createElement('tr');
         {
            const videoInputCheckCell = document.createElement('td');
               const videoInputCheck = document.createElement('input');
               videoInputCheck.type = 'checkbox';
               videoInputCheck.id = 'videoInputCheckList' + id;
               videoInputCheck.onclick = () => {
                  UI.updateUIStatus(id);
                  CallMgr.updateVideoStatus(id);
               }
            videoInputCheckCell.appendChild(videoInputCheck);

            // Video Input Label with check
            const videoInputLabelCell = document.createElement('td');
               const videoInputLabel = document.createElement('label');
               videoInputLabel.innerHTML = '<b>Video Input:</b>';
               videoInputLabel.htmlfor = videoInputCheck.id;
            videoInputLabelCell.appendChild(videoInputLabel);

            // Video Input Device List
            const videoInputSelectCell = document.createElement('td');
               const videoInputSelect = document.createElement('select');
               videoInputSelect.id = 'videoInputList' + id;
               videoInputSelect.style.width = '400px';
            videoInputSelectCell.appendChild(videoInputSelect);
            videoInputSelectCell.setAttribute('colspan', '2');

            videoInputRow.appendChild(videoInputCheckCell);
            videoInputRow.appendChild(videoInputLabelCell);
            videoInputRow.appendChild(videoInputSelectCell);
         }


         selectTable.appendChild(audioInputRow);
         selectTable.appendChild(audioOutputRow);
         selectTable.appendChild(videoInputRow);
      }
      selectCell.appendChild(selectTable);
   }


   const selfViewWrapperCell = document.createElement('td');
   if (selfViewWrapperCell) {
      selfViewWrapperCell.setAttribute('rowspan', '2');
      const selfViewDiv = document.createElement('div');
      selfViewDiv.id = 'selfViewWrapper' + id;
      selfViewWrapperCell.appendChild(selfViewDiv);
   }

   inputRow.append(inputCell);
   inputRow.append(selectCell);
   inputRow.append(selfViewWrapperCell);

   tableElement.appendChild(tableRow);
   tableElement.appendChild(inputRow);

   // Error row
   const errorRow = document.createElement('tr');
      const errorCell = document.createElement('td');
      errorCell.setAttribute('colspan', 2);
         const errorDiv = document.createElement('div');
         errorDiv.id = 'errorList' + id;
         errorDiv.innerText = 'Info:'
      errorCell.appendChild(errorDiv);
   errorRow.appendChild(errorCell);
   tableElement.appendChild(errorRow);

   meetingInfoDiv.appendChild(tableElement);
   callDiv.appendChild(meetingInfoDiv);

   const meetingContentDiv = document.createElement("div");
   meetingContentDiv.id = "meetingContent" + id;
   meetingContentDiv.setAttribute("hidden", "true");
   callDiv.appendChild(meetingContentDiv);

   const buttonDiv = document.createElement('div');
      buttonDiv.setAttribute('align', 'center');
      const buttonsData = [
         { id: 'getdevice', label: 'Get Devices List' },
         { id: 'getSelfView', label: 'Get Self View' },
         { id: 'muteMic', label: 'Mute Mic' },
         { id: 'muteCamera', label: 'Mute Camera' },
         { id: 'shareScreen', label: 'Share Screen' }
      ];
      buttonsData.forEach(data => {
         const button = document.createElement('button');
         button.id = data.id + id;
         button.textContent = data.label;
         buttonDiv.appendChild(button);
      });
   callDiv.appendChild(buttonDiv);

   // Incoming Dialog Div
   const incomingDialogDiv = document.createElement('div');
      incomingDialogDiv.id = 'incomingDialog' + id;
      incomingDialogDiv.style.textAlign = 'center';
      incomingDialogDiv.style.display = 'none';

      const callInfoLabel = document.createElement('label');
      callInfoLabel.textContent = 'Received Incoming Call From: ';
      const callerIdLabel = document.createElement('label');
      callerIdLabel.id = 'callerId' + id;
      const answerCallButton = document.createElement('button');
      answerCallButton.id = 'answerCall' + id;
      answerCallButton.style.color = 'green';
      answerCallButton.textContent = 'Answer';
      const rejectCallButton = document.createElement('button');
      rejectCallButton.id = 'rejectCall' + id;
      rejectCallButton.style.color = 'red';
      rejectCallButton.textContent = 'Reject';

      incomingDialogDiv.appendChild(callInfoLabel);
      incomingDialogDiv.appendChild(callerIdLabel);
      incomingDialogDiv.appendChild(answerCallButton);
      incomingDialogDiv.appendChild(rejectCallButton);
   callDiv.appendChild(incomingDialogDiv);

   const remotePeerAreaDiv = document.createElement('div');
   remotePeerAreaDiv.id = 'remotePeerArea' + id;
   remotePeerAreaDiv.style.alignContent = 'center';
   remotePeerAreaDiv.style.whiteSpace = 'nowrap';

   const peerTable = document.createElement('table');
   peerTable.setAttribute('border', '1');
   peerTable.setAttribute('align', 'center');
   peerTable.setAttribute('width', '900');

   // Create the first row for call input and buttons
   const callInputRow = document.createElement('tr');
   callInputRow.setAttribute('align', 'center');

   const callInputCell = document.createElement('td');
   callInputCell.setAttribute('colspan', '2');
   const callingLabel = document.createElement('label');
   callingLabel.id = 'callingLabel' + id;
   callingLabel.style.display = 'none';
   const calleeInput = document.createElement('input');
   calleeInput.id = 'callee' + id;
   calleeInput.type = 'text';
   const makeCallButton = document.createElement('button');
   makeCallButton.id = 'makeCall' + id;
   makeCallButton.textContent = 'Call';

   callInputCell.appendChild(callingLabel);
   callInputCell.appendChild(calleeInput);
   callInputCell.appendChild(makeCallButton);

   callInputRow.appendChild(callInputCell);

   const remoteVideoRow = document.createElement('tr');
   remoteVideoRow.id = 'remoteVideoArea' + id;
   remoteVideoRow.style.textAlign = 'center';

   const remoteVideoCell = document.createElement('td');
      remoteVideoCell.setAttribute('width', '80%');
      remoteVideoCell.setAttribute('rowspan', '2');
      const remoteVideoWrapper = document.createElement('div');
      remoteVideoWrapper.id = 'remoteVideoWrapper' + id;
      remoteVideoWrapper.style.alignContent = 'center';
      remoteVideoCell.appendChild(remoteVideoWrapper);


   const remoteMediaStatusCell = document.createElement('td');
   remoteMediaStatusCell.setAttribute('width', '20%');

   const remoteMediaStatus = document.createElement('div');
      remoteMediaStatus.id = 'remoteMediaStatus' + id;
      remoteMediaStatus.style.alignContent = 'center';
      remoteMediaStatus.style.display = 'none';

      const remoteAudioStatus = document.createElement('label');
         remoteAudioStatus.id = 'remoteAudioStatus' + id;
         remoteAudioStatus.style.color = 'green';
         remoteAudioStatus.style.fontSize = '18px';
         remoteAudioStatus.textContent = 'Enabled';
      remoteMediaStatus.appendChild(remoteAudioStatus);

      const remoteVideoStatus = document.createElement('label');
         remoteVideoStatus.id = 'remoteVideoStatus' + id;
         remoteVideoStatus.style.color = 'green';
         remoteVideoStatus.style.fontSize = '18px';
         remoteVideoStatus.textContent = 'Enabled';
      remoteMediaStatus.appendChild(remoteVideoStatus);

      remoteMediaStatus.appendChild(document.createElement('br'));

   remoteMediaStatusCell.appendChild(remoteMediaStatus);

   remoteVideoRow.appendChild(remoteVideoCell);
   remoteVideoRow.appendChild(remoteMediaStatusCell);

   const miniRemoteVideoRow = document.createElement('tr');

   const miniRemoteVideoCell = document.createElement('td');
   miniRemoteVideoCell.setAttribute('width', '20%');
   const miniRemoteVideoWrapper = document.createElement('div');
   miniRemoteVideoWrapper.id = 'miniRemoteVideoWrapper' + id;
   miniRemoteVideoCell.appendChild(miniRemoteVideoWrapper);

   miniRemoteVideoRow.appendChild(miniRemoteVideoCell);

   peerTable.appendChild(callInputRow);
   peerTable.appendChild(remoteVideoRow);
   peerTable.appendChild(miniRemoteVideoRow);

   remotePeerAreaDiv.appendChild(peerTable);

   callDiv.appendChild(remotePeerAreaDiv);

   // Set the event handler
   document.getElementById("getdevice" + id).onclick = () => {
      UI.getDeviceList();
   };
   document.getElementById("muteMic" + id).onclick = () => {
      let audioTrack = CallMgr.audio_track(id);
      if (audioTrack) {
         CallMgr.muteAudio(audioTrack.enabled, id);
      }
      UI.updateUIStatus(id);
   }
   document.getElementById("muteCamera" + id).onclick = () => {
      let videoTrack = CallMgr.video_track(id);
      if (videoTrack) {
         CallMgr.muteVideo(videoTrack.enabled, id);
      }
      UI.updateUIStatus(id);
   }
   document.getElementById("shareScreen" + id).onclick = () => {
      UI.startScreenShare(id);
   }
   document.getElementById("makeCall" + id).onclick = () => {
      let inCall = CallMgr.calls && CallMgr.calls[id] && CallMgr.calls[id].status !== SessionStatus.IDLE;
      if (inCall) {
         UI.endCall(id)
      } else {
         UI.makeCall(id);
      }
   }
   UI.updateUIStatus(id);
};

UI.clearDeviceList = function(id) {
   for (var i = (id ? id : 0); i < (id ? id : this.callUI.length); i++) {
      let prefixs = ["audioInputList", "audioOutputList", "videoInputList"];
      prefixs.forEach(function(prefix) {
         let select = document.getElementById(prefix + i);
         if (select) {
            // Remove each options.
            while (select.options.length) {
               select.remove(0);
            }
            select.onchange = null;
         }
      });
   }
};


UI.updateUIStatus = function(id) {
   // Update the global UI element.
   UI.agentConnectionLabel.innerHTML = UI.WebRTCRedirApp.isAgentConnected ? 'Horizon agent connected' : 'Horizon agent not connected';
   UI.agentConnectionLabel.style.color = UI.WebRTCRedirApp.isAgentConnected ? 'green' : 'red';

   if (UI.loginButton) {
      UI.loginButton.disabled = !UI.WebRTCRedirApp.isAgentConnected;
      UI.loginButton.innerHTML = CallMgr.loggedIn ? 'Logout' : 'Login';
   }
   if (UI.addCallButton) {
      UI.addCallButton.hidden = !UI.WebRTCRedirApp.isAgentConnected || UI.WebRTCRedirApp.disableMultiAudio;
      UI.addCallButton.disabled = UI.nextCallId >= UI.maxNumOfCalls;
   }

   // Update UI for each call.
   if (id === undefined) {
      return;
   }

   let audioCheck = document.getElementById('audioInputCheckList' + id);
   let audioSelect = document.getElementById('audioInputList' + id);
   let audioOutputSelect = document.getElementById('audioOutputList' + id);
   let videoCheck = document.getElementById('videoInputCheckList' + id);
   let videoSelect = document.getElementById('videoInputList' + id);
   let device_button = document.get

   let getdevice_button = document.getElementById('getdevice' + id);
   let getSelfView_button = document.getElementById('getSelfView' + id);
   let muteMic_button = document.getElementById('muteMic' + id);
   let muteCam_button = document.getElementById('muteCamera' + id);
   let screenshare_button = document.getElementById('shareScreen' + id);
   let call_button = document.getElementById('makeCall' + id);

   let loggedIn = CallMgr.loggedIn;
   let inCall = CallMgr.calls && CallMgr.calls[id] && CallMgr.calls[id].status !== SessionStatus.IDLE;

   if (!loggedIn) {
      audioCheck.checked = false;
      videoCheck.checked = false;
      UI.clearDeviceList(id);
   }

   audioCheck.disabled = !loggedIn;
   audioSelect.disabled = !loggedIn || !audioCheck.checked;
   audioOutputSelect.disabled = !loggedIn;
   videoCheck.disabled = !loggedIn;
   videoSelect.disabled = !loggedIn || !videoCheck.checked;


   getdevice_button.disabled = !loggedIn;
   getSelfView_button.disabled = !loggedIn || !videoCheck.checked;

   let audioTrack = CallMgr.audio_track(id);
   muteMic_button.disabled = !loggedIn || !audioCheck.checked || !inCall || !audioTrack;
   muteMic_button.innerHTML = (muteMic_button.disabled || audioTrack.enabled) ? 'Mute Mic' : 'Unmute Mic';

   let videoTrack = CallMgr.video_track(id);
   muteCam_button.disabled = !loggedIn || !videoCheck.checked || !inCall || !videoTrack;
   muteCam_button.innerHTML = (muteCam_button.disabled || videoTrack.enabled) ? 'Mute Camera' : 'Unmute Camera';

   screenshare_button.disabled = !loggedIn || !inCall;
   call_button.disabled = !loggedIn;
   call_button.innerHTML = inCall ? 'End Call' : 'Call';

   let allowVideo = loggedIn && videoCheck.checked;
   if (!allowVideo) {
      this.setSelfView(id, undefined, false);
   }
}

UI.login = function() {
   let userId = document.getElementById("userName").value;
   CallMgr.login(userId, UI.callUI.length);
};

UI.onLogin = function() {
   let userId = document.getElementById("userName").value;
   for (var i = 0; i < this.callUI.length; i++) {
      const id = i;
      if (id != 0) {
         document.getElementById("loginText" + id).innerHTML = "logged in as " + userId;
      }
      this.updateUIStatus(id);
   }
};

UI.logout = function() {
   CallMgr.disconnect();
};

UI.onLogout = function() {
   for (var i = 0; i < this.callUI.length; i++) {
      const id = i;
      CallMgr.endCall(true, id);
      if (id != 0) {
         document.getElementById("loginText" + id).innerHTML = "Login with call 1 buttons";
      }
      this.updateUIStatus(id);
   }
};

UI.getDeviceList = async function(init) {
   UI.clearDeviceList();
   let deviceList;
   try {
      if (UI.WebRTCRedirApp.isAgentConnected) {
         deviceList = await UI.WebRTCRedirApp.HorizonRedirSDK.enumerateDevices();
      } else {
         deviceList = await navigator.mediaDevices.enumerateDevices();
      }
   } catch (error) {
      Utils.logError("UI", "Failed to get device list from enumerateDevices: " + JSON.stringify(error));
      return;
   }

   if (!deviceList || !deviceList.length) {
      return;
   }

   for (var i = 0; i < this.callUI.length; i++) {
      // populate each section.
      const id = i;
      let audio_input_list = document.getElementById("audioInputList" + id);
      audio_input_list.onchange = (event) => {
         UI.audioInputOnChange(event, id);
      }

      let audio_output_list = document.getElementById("audioOutputList" + id);
      audio_output_list.onchange = (event) => {
         UI.audioOutputOnChange(event, id);
      }

      let video_input_list = document.getElementById("videoInputList" + id);
      video_input_list.onchange = (event) => {
         UI.videoInputOnChange(event, id);
      }
      let default_group_id;
      deviceList.forEach((device)=>{
         let option = document.createElement("option");
         option.text = device.label;
         option.value = device.deviceId;
         option.group_id = device.groupId;
         if (device.kind == 'audioinput') {
            if (device.deviceId != 'default') {
               audio_input_list.add(option);
            } else {
               default_group_id =  device.groupId;
            }
         } else if (device.kind == 'audiooutput') {
            if (device.deviceId != 'default') {
               audio_output_list.add(option);
            }
         } else if (device.kind == 'videoinput')
            if (device.deviceId != 'default') {
               video_input_list.add(option);
            }
      });

      // set the default audio input and audio output
      UI.selectAudioInput(id, default_group_id);
      UI.selectAudioOutput(id, default_group_id);
      if (init) {
         document.getElementById('audioInputCheckList' + id).checked = audio_input_list.options.length;
         this.updateUIStatus(id);
      }
   }
};

UI.selectAudioInput = function(id, group_id) {
   let audio_input_list = document.getElementById("audioInputList" + id);
   if (audio_input_list && group_id) {
      for (let k = 0; k < audio_input_list.options.length; k++) {
         if (audio_input_list.options[k].group_id == group_id) {
            audio_input_list.selectedIndex = k;
            break;
         }
      }
   }
};


UI.selectAudioOutput = function(id, group_id) {
   let audio_output_list = document.getElementById("audioOutputList" + id);
   if (audio_output_list && group_id) {
      for (let k = 0; k < audio_output_list.options.length; k++) {
         if (audio_output_list.options[k].group_id == group_id) {
            audio_output_list.selectedIndex = k;
            break;
         }
      }
   }
};

UI.showError = function(id, error) {
   let errorText = document.getElementById('errorList' + id);
   if (error && errorText) {
      errorText.innerText = error;
   }
   return;
};

UI.audioInputOnChange = async function(event, id) {
   const select = event.target;
   const deviceId = select.value;
   if (CallMgr.calls[id] && (CallMgr.calls[id].status === SessionStatus.IDLE)) {
      // If not in the call, auto select the output device that matches the input.
      UI.selectAudioOutput(id, select[select.selectedIndex].group_id);
   }
   CallMgr.updateAudioStatus(id);
};

UI.audioOutputOnChange = async function(event, id) {
   if (document.getElementById("remoteAudioElement" + id)) {
      const deviceId = event.target.value;
      document.getElementById("remoteAudioElement" + id).setSinkId(deviceId);
   }
};

UI.videoInputOnChange = async function(event, id) {
   const deviceId = event.target.value;
   this.setSelfView(id, deviceId, false);
   CallMgr.updateVideoStatus(id);
};

UI.incomingCall = async function(id, userId) {
   // Show incoming call dialog
   document.getElementById("callerId" + id).innerHTML = userId;
   //TODO MOVE THIS TO A UI FUNCTION
   document.getElementById("answerCall" + id).onclick = () => {
      CallMgr.answerCall(id);
   }
   document.getElementById("rejectCall" + id).onclick = () => {
      CallMgr.rejectCall(id);
   }
   document.getElementById("incomingDialog" + id).style.display = "";
};

UI.currentSelected = function(elementId) {
   let select = document.getElementById(elementId);
   let deviceId = select.options[select.selectedIndex].value;
   return deviceId;
};

UI.currentSelectedAudioInput = function(id) {
   let check = document.getElementById('audioInputCheckList' + id);
   return check && check.checked ? this.currentSelected('audioInputList' + id) : undefined;
};

UI.currentSelectedAudioOutput = function(id) {
   return this.currentSelected('audioOutputList' + id);
};

UI.currentSelectedVideoInput = function(id) {
   let check = document.getElementById('videoInputCheckList' + id);
   return check && check.checked ? this.currentSelected('videoInputList' + id) : undefined;
};


UI.startSelfView = async function(id) {
   let deviceId = this.currentSelectedVideoInput(id);
   this.setSelfView(id, deviceId, true);
};

UI.stopSelfView = function(id) {
   this.setSelfView(id, undefined, true);
};

UI.setSelfView = async function(id, deviceId, ensureVideo) {
   let videoStream;
   let hasVideo = !!UI.WebRTCRedirApp.localVideoStream[id] && !!UI.WebRTCRedirApp.selfViewVideo[id]
   let prevDeviceId = UI.WebRTCRedirApp.localVideoDeviceIds[id];
   if (hasVideo || ensureVideo || deviceId !== prevDeviceId) {
      if (!!deviceId) {
         let constraints = {video: { deviceId: deviceId }, audio: false};
         videoStream = await CallMgr.getUserMedia(id, constraints);
      }
   }

   let container = document.getElementById('selfViewWrapper' + id);
   let video = UI.WebRTCRedirApp.selfViewVideo[id];
   if (videoStream) {
      Utils.log('UI', 'video_' + id + "is set to use deviceId " + deviceId);
      if (!video) {
         // Create video element
         video = document.createElement('video');
         let windowRef = await window.getWindowReference();
         UI.WebRTCRedirApp.HorizonRedirSDK.onVideoCreated(video, windowRef);
         container.appendChild(video);
         video.autoplay = true;
         video.style.objectFit = "cover";
         video.style.width = "160px";
         video.style.height = "90px";
      }
      video.srcObject = videoStream;
      UI.WebRTCRedirApp.localVideoDeviceIds[id] = deviceId;
      UI.WebRTCRedirApp.selfViewVideo[id] = video;

      let prevStream = UI.WebRTCRedirApp.localVideoStream[id];
      Utils.stopStream(prevStream);
      UI.WebRTCRedirApp.localVideoStream[id] = videoStream;

      document.getElementById("getSelfView" + id).innerHTML = "Stop Self View";
      document.getElementById("getSelfView" + id).onclick = () => {
         UI.stopSelfView(id);
      }
   } else {
      Utils.log('UI', 'video_' + id + "preview gets reset");
      if (video) {
         container.removeChild(video);
         video.srcObject = undefined;
         video = undefined;
      }
      UI.WebRTCRedirApp.localVideoDeviceIds[id] = undefined;
      UI.WebRTCRedirApp.selfViewVideo[id] = undefined;

      let prevStream = UI.WebRTCRedirApp.localVideoStream[id];
      Utils.stopStream(prevStream);
      UI.WebRTCRedirApp.localVideoStream[id] = undefined;

      document.getElementById("getSelfView" + id).innerHTML = "Start Self View";
      document.getElementById("getSelfView" + id).onclick = () => {
         UI.startSelfView(id);
      }
   }
};

UI.updateAgentConnectionStatus = function(isConnected) {
   UI.WebRTCRedirApp.isAgentConnected = isConnected;
   UI.WebRTCRedirApp.disableMultiAudio = !CallMgr.SDK || CallMgr.SDK.getCallConfig(0) === undefined; // legacy agent
   UI.updateUIStatus();
};

UI.makeCall = function(id) {
   let calleeId = document.getElementById("callee" + id).value;
   if (!calleeId) {
      Utils.logError("UI", "makeCall, there is no specified callee!!!");
      return;
   }

   if (calleeId == CallMgr.userId) {
      Utils.logWarn("UI", "makeCall, you cannot call yourself");
      return;
   }
   CallMgr.makeCall(calleeId, id);
};

UI.endCall = function(id) {
   CallMgr.endCall(true, id);
};

UI.onCallStarted = function(id) {
   this.updateUIStatus(id);
}

UI.onCallEnded = function(id) {
   this.updateUIStatus(id);

   document.getElementById("remoteMediaStatus" + id).style.display = "none";
   document.getElementById("callingLabel" + id).style.display = "none";
   document.getElementById("callee" + id).disabled = false;

   try {
      const remoteShareVideoElement = document.getElementById("remoteShareVideo" + id);
      if (remoteShareVideoElement) {
         document.getElementById("remoteVideoWrapper" + id).removeChild(remoteShareVideoElement);
         document.getElementById("miniRemoteVideoWrapper" + id).removeChild(document.getElementById("remoteVideo" + id));
      } else {
         document.getElementById("remoteVideoWrapper" + id).removeChild(document.getElementById("remoteVideo" + id));
      }
   } catch(e) {
      Utils.log("UI", "no video to remove");
   }

   try {
      document.getElementById("remoteVideoWrapper" + id).removeChild(document.getElementById("remoteAudioElement" + id));
   } catch(e) {
      Utils.log("UI", "no remote audio element to remove");
   }
   document.getElementById("remoteVideoArea" + id).style.display = "none";

   document.getElementById("incomingDialog" + id).style.display = "none";
};


UI.startScreenShare = function(id) {
   document.getElementById("shareScreen" + id).innerHTML = "Stop Share Screen";
   document.getElementById("shareScreen" + id).onclick = () => {
      UI.stopScreenShare(id);
   }

   CallMgr.startScreenShare(id);
};


UI.stopScreenShare = function(id) {
   UI.resetScreenShareUI(id);
   CallMgr.teardownScreenShare(true, id);
};


UI.resetScreenShareUI = function(id) {
   document.getElementById("shareScreen" + id).innerHTML = "Share Screen";
   document.getElementById("shareScreen" + id).onclick = () => {
      UI.startScreenShare(id);
   }
   document.getElementById("shareScreen" + id).disabled = "";

   if (document.getElementById("remoteShareVideo" + id)) {   // receiving
      const remoteShareVideo = document.getElementById("remoteShareVideo" + id);
      document.getElementById("remoteVideoWrapper" + id).removeChild(remoteShareVideo);
      if (document.getElementById("remoteVideo" + id)) {
         const remoteVideo = document.getElementById("remoteVideo" + id);
         document.getElementById("miniRemoteVideoWrapper" + id).removeChild(remoteVideo);
         remoteVideo.style.width = "640px";
         remoteVideo.style.height = "360px";
         document.getElementById("remoteVideoWrapper" + id).appendChild(remoteVideo);
      }
   }
};


UI.onHavingCall = function(peerId, id) {

   document.getElementById("incomingDialog" + id).style.display = "none";

   document.getElementById("callingLabel" + id).innerHTML = "Connecting Call To: ";
   document.getElementById("callingLabel" + id).style.display = "";
   document.getElementById("callee" + id).value = peerId;
   document.getElementById("callee" + id).disabled = true;
   UI.showError(id, '');

};


UI.onCallConnected = function(id) {
   Utils.log("UI", "call connected.");
   document.getElementById("callingLabel" + id).innerHTML = "Having call with: ";
   document.getElementById("remoteMediaStatus" + id).style.display = "";
};


UI.onRemoteVideoStream = async function(videoStream, id) {
   let remoteVideo = document.createElement('video');
   remoteVideo.id = "remoteVideo" + id;

   if (UI.WebRTCRedirApp.isAgentConnected) {
      let hwnd = await window.getWindowReference();
      UI.WebRTCRedirApp.HorizonRedirSDK.onVideoCreated(remoteVideo, hwnd);
      remoteVideo.srcObject = videoStream;

      document.getElementById("remoteVideoWrapper" + id).appendChild(remoteVideo);
      remoteVideo.autoplay = true;
      remoteVideo.style.objectFit = "cover";
      remoteVideo.style.width = "640px";
      remoteVideo.style.height = "360px";
      document.getElementById("remoteVideoArea" + id).style.display = "";
   }
};


UI.onRemoteAudioStream = async function(audioStream, id) {
   let remoteAudio = document.createElement('audio');
   remoteAudio.id = "remoteAudioElement" + id;

   if (UI.WebRTCRedirApp.isAgentConnected) {
      let hwnd = await window.getWindowReference();
      UI.WebRTCRedirApp.HorizonRedirSDK.onAudioCreated(remoteAudio, hwnd);
      remoteAudio.srcObject = audioStream;
      document.getElementById("remoteVideoWrapper" + id).appendChild(remoteAudio);
      remoteAudio.autoplay = true;

      // see what is currently selected
      const deviceId = this.currentSelectedAudioOutput(id);
      remoteAudio.setSinkId(deviceId ? deviceId : UI.defaultAudioOutput);

   }
};


UI.onRemoteShareStream = async function(shareStream, id) {
   if (document.getElementById("remoteVideo" + id)) {
      const remoteVideo = document.getElementById("remoteVideo" + id)
      document.getElementById("remoteVideoWrapper" + id).removeChild(remoteVideo);
      remoteVideo.style.width = "160px";
      remoteVideo.style.height = "90px";
      document.getElementById("miniRemoteVideoWrapper" + id).appendChild(remoteVideo);
   }
   document.getElementById("shareScreen" + id).disabled = true;

   let remoteShareVideo = document.createElement('video');
   remoteShareVideo.id = "remoteShareVideo" + id;

   if (UI.WebRTCRedirApp.isAgentConnected) {
      let windowRef = await window.getWindowReference();
      UI.WebRTCRedirApp.HorizonRedirSDK.onVideoCreated(remoteShareVideo, windowRef);
   }
   remoteShareVideo.srcObject = shareStream;

   document.getElementById("remoteVideoWrapper" + id).appendChild(remoteShareVideo);
   UI.remoteShareVideoElement = remoteShareVideo;
   remoteShareVideo.autoplay = true;
   remoteShareVideo.style.objectFit = "cover";
   remoteShareVideo.style.width = "640px";
   remoteShareVideo.style.height = "360px";
   document.getElementById("remoteVideoArea" + id).style.display = "";
};


UI.addCall = function() {
   if (this.nextCallId >= this.maxNumOfCalls) {
      console.log('Max number of calls reached');
      return;
   }

   let id = this.nextCallId++;
   this.generateCallUI(id);
   if (this.nextCallId >= this.maxNumOfCalls) {
      console.log('Max number of calls reached');
      this.addCallButton.disabled = true;
      this.addCallButton.onclick = null;
   }

   if (CallMgr.loggedIn) {
      CallMgr.addCall(id);
      this.getDeviceList();
   }
};

// adds the call UIs necessary until there are x calls
UI.addUpToCall = function(x) {
   if (x < 0) {
      console.error("can't add negative calls");
      return;
   }
   if (x >= 10) {
      console.error("No more than 10 call UI can be added");
   }
   while(!this.callUI[x]) {
      UI.addCall();
   }
};

export default UI;
