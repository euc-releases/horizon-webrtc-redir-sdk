/*
 * Copyright (c) Omnissa, LLC. All rights reserved.
 * This product is protected by copyright and intellectual property laws in the
 * United States and other countries as well as by international treaties.
 * -- Omnissa Restricted
 */

import  UI from "./ui.js";

var Demo = Demo || function() {
   var WebRTCRedirApp = {};
   var wssPortNumber;
   var clientID;
   var maxNumOfCallConfigs = 3;

   const HorizonAgentEventCallback = function(evt) {
      let event = evt.event;
      console.log("App Main ===> get event from WebRTCRedirSDK: " + event);
      switch(event) {
         case "vdiClientConnected":
            UI.updateAgentConnectionStatus(true);
            break;
         case "vdiClientDisconnected":
            UI.updateAgentConnectionStatus(false);
            break;
         default:
            console.log("App Main ===> get unknow event from WebRTCRedirSDK: " + JSON.stringify(evt));
      }
   };

   // This callback is only used for the standalone app.
   var handleEnvInfo = function(envInfo) {
      if (envInfo.callServerUrl) {
         console.log("App Main ===> get callServerUrl from main process: " + envInfo.callServerUrl);
         WebRTCRedirApp.callServerUrl = envInfo.callServerUrl;
      }

      if (envInfo.disableMultiAudio) {
         console.log("App Main ===> get disableMultiAudio from main process: " + envInfo.disableMultiAudio);
         WebRTCRedirApp.disableMultiAudio = envInfo.disableMultiAudio;
      }

      // window handle
      if (envInfo.winHandle) {
         console.log("App Main ===> get window handle from main process: " + envInfo.winHandle);
         window.winHandle = envInfo.winHandle;
         WebRTCRedirApp.winHandle = window.winHandle;
      }

      // wssPortNumber
      if (envInfo.wssPortInfo && envInfo.wssPortInfo.secureWebport) {
         wssPortNumber = envInfo.wssPortInfo.secureWebport.value;
         console.log("App Main ===> get wssPortNumber from main process: " + wssPortNumber);
      } else {
         console.warn("App Main ===> Could not figure out wss port number for html5server. App might be running on non-vdi environment.");
      }

      // clientID
      if (envInfo.clientID) {
         clientID = envInfo.clientID;
         console.log("App Main ===> get clientID from main process: " + clientID);
      } else {
         console.warn("App Main ===> Could not figure out clientID for VM View Client. App might be running on non-vdi environment.");
      }

      // init WebRTC Redir SDK if we have enough information
      if (window.winHandle && wssPortNumber && clientID && WebRTCRedirApp.HorizonRedirSDK) {
         console.log("App Main ===>App is running on vdi environment. Init redirection SDK.");
         let sdkConfig = { numOfCallConfigs: maxNumOfCallConfigs };
         WebRTCRedirApp.HorizonRedirSDK.initSDK({}, "Horizon Electron Sample App",
            HorizonAgentEventCallback, sdkConfig);
      }
   };

   var initStandaloneApp = function() {
      navigator.mediaDevices.getDisplayMedia = async () => {
         const selectedSource = await globalThis.electronGetDisplayMedia();
         const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
               mandatory: {
                  chromeMediaSource: "desktop",
                  chromeMediaSourceId: selectedSource.id,
                  minWidth: 1280,
                  maxWidth: 1280,
                  minHeight: 720,
                  maxHeight: 720,
               },
            },
         });

         return stream;
      };

      window.getWindowReference = async () => {
         return Promise.resolve(WebRTCRedirApp.winHandle);
      };

      window.getHorizonClientID = async () => {
         return Promise.resolve(clientID);
      };

      window.getHorizonWSSPort = async () => {
         let portNumber = wssPortNumber.toString();
         return Promise.resolve(portNumber);
      };

      WebRTCRedirApp = {
         callServerUrl: "",
         HorizonRedirSDK: window.HorizonWebRtcRedirectionAPI,
         ui: UI,
         localVideoDeviceIds:[],
         localVideoStream: [],
         selfViewVideo: [],
         disableMultiAudio: true
      };
      window.WebRTCRedirApp = WebRTCRedirApp;

      window.api.receive("fromMain", (data) => {
         let event = JSON.parse(data);
         switch (event.type) {
            case "envInfo":
               handleEnvInfo(event);
               break;
            default:
               console.log("App Main ===> unknow event from app:" + event.type);
         }
      });

      window.onerror = function(message, source, lineno, colno, error) {
         console.error('Error message:', message);
         console.error('Error source:', source);
         console.error('Error line number:', lineno);
         console.error('Error column number:', colno);
         console.error('Error object:', error);
       };

      setTimeout(() => {
         window.api.send("toMain", "getEnvInfo");
      }, 2000);

      WebRTCRedirApp.ui.init(maxNumOfCallConfigs);
      return WebRTCRedirApp;
   };

   var initWebApp = async function(callServerUrl) {
      /*We assume the browser extension will create window.HorizonWebRTCExtension object*/
      window.getHorizonClientID = async () => {
         if (window.HorizonWebRTCExtension) {
            return window.HorizonWebRTCExtension.getHorizonClientID();
         } else {
            return Promise.reject('Fail to get horizon client ID');
         }
      };

      window.getHorizonWSSPort = async () => {
         if (window.HorizonWebRTCExtension) {
            return window.HorizonWebRTCExtension.getHorizonWSSPort();
         } else {
            return Promise.reject('Fail to get horizon WSS port');
         }
      };

      // Place holder for web environment
      WebRTCRedirApp = {
         HorizonRedirSDK: window.HorizonWebRtcRedirectionAPI,
         ui: UI,
         localVideoDeviceIds:[],
         localVideoStream: [],
         selfViewVideo: [],
         disableMultiAudio: true,
         callServerUrl: "",
      };
      WebRTCRedirApp.callServerUrl = callServerUrl;
      if (WebRTCRedirApp.callServerUrl === "") {
         console.error("App Main ===> callServerUrl is empty, will not be able to make calls");
      }

      if (window.HorizonWebRTCExtension) {
         /*
          * For web client, we can hook up the onWindowSessionConnected callback
          * that gets fired by the browser extension.
          */
         window.HorizonWebRTCExtension.onWindowSessionConnected = function(connected) {
            // Simply log the connected state now.
            console.log('onWindowSessionConnected:' + connected);
         }
      }
      

      window.WebRTCRedirApp = WebRTCRedirApp;
      WebRTCRedirApp.ui.init(maxNumOfCallConfigs);

      // Poll websocket and initSDK
      let sdkConfig;
      // Pass browser type, maxNumOfCallConfigs to sdkConfig e.g
      sdkConfig = { numOfCallConfigs: maxNumOfCallConfigs };
      WebRTCRedirApp.HorizonRedirSDK.initSDK({}, "Horizon Electron Sample App",
         HorizonAgentEventCallback, sdkConfig);
      return WebRTCRedirApp;
   }

   if (window.api) {
      return initStandaloneApp();
   } else {
      /*
       * For web client, the signal server url is passed by the url parameter.
       */
      let params = new URLSearchParams(window.location.search);
      let callServerUrl = params.get('callServerUrl');
      return initWebApp(callServerUrl);
   }
}();
