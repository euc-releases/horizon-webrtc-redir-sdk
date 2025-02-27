/*
 * Copyright (c) Omnissa, LLC. All rights reserved.
 * This product is protected by copyright and intellectual property laws in the
 * United States and other countries as well as by international treaties.
 * -- Omnissa Restricted
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const regedit = require('regedit');
const taskList = require('tasklist');
const fs = require('fs');
regedit.setExternalVBSLocation('regedit/vbs');

let win;

let sessionId;
let wssPortInfo = null;
let clientID = null;

app.disableHardwareAcceleration();

// ignore self-signed certificate error and gpu error
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('disable-gpu');

let gWssPortRegistryPath = 'HKCU\\Software\\Omnissa\\Horizon\\HTML5 Redirection Server\\';
let gLegacyWssPortRegistryPath = 'HKCU\\Software\\VMware, Inc.\\HTML5 Redirection Server\\';
let gClientIDRegistryPath = 'HKCU\\Volatile Environment\\';

const OSType = os.platform();

// Read configure file for server information
let pageUlr = "";
let callServerUrl = "";
let disableMultiAudio = false;

try {
   let rawdata = fs.readFileSync('serverInfo.json');
   let serverInfo = JSON.parse(rawdata);
   pageUlr = serverInfo.pageUlr;
   callServerUrl = serverInfo.callServerUrl;
   if (serverInfo.hasOwnProperty("disableMultiAudio") && serverInfo.disableMultiAudio == false) {
      disableMultiAudio = true;
   }
} catch (error) {
   console.log("Main process ===> failed to read server info from config file:" + error);
}


async function createWindow () {
   win = new BrowserWindow({
      icon:"resource/horizon_icon.png",
      width: 1280,
      height: 720,

      webPreferences: {
         nodeIntegration: false,
         contextIsolation: true,
         enableRemoteModule: false,
         preload: path.join(__dirname, "preload.js")
      }
   });

   win.loadURL(pageUlr);

   if (OSType === "win32") {
      // Get session id. You might use some other ways
      let osTaskList = await taskList();
      for (let i = 0; i < osTaskList.length; i++) {
         let task = osTaskList[i];
         if (task.imageName === "electron.exe" || task.imageName === "HorizonWebRTCRedirApp.exe") {
            sessionId = task.sessionNumber;
            break;
         }
      }

      let clientIDRegistryPath = gClientIDRegistryPath + sessionId.toString();
      try {
         regedit.list(clientIDRegistryPath, function(err, result) {
            if (!result && err.stdout) {
               let _p = err.stdout.indexOf('ViewClient_Client_ID');
               let tmpStr = err.stdout.substring(_p);
               _p = tmpStr.indexOf('value');
               tmpStr = tmpStr.substring(_p);
               _p = tmpStr.indexOf('}');
               tmpStr = tmpStr.substring(0, _p);
               clientID = tmpStr.split('"')[2];
            } else if (result) {
               if (result[clientIDRegistryPath] || result[clientIDRegistryPath].exists) {
                  let clientIDInfo = result[clientIDRegistryPath].values.ViewClient_Client_ID;
                  if (clientIDInfo) {
                     clientID = clientIDInfo.value;
                  }
               }
            }
         });
      } catch(error) {
         console.log("Main process ===> Could not read registry. Maybe not in VDI env.");
      }
   }

   // Update browser window maximized state
   win.on('resize', function() {
      let windowInfo = { type: 'windowInfo'};
      windowInfo.isMaximized = win.isMaximized();
      win.webContents.send("fromMain", JSON.stringify(windowInfo));      
   });
}


app.whenReady().then(() => {
   createWindow();
});

ipcMain.on("toMain", (event, args) => {
   console.log("Main process ===> receive msg from app: " + JSON.stringify(args));
   switch (args) {
      case "getEnvInfo":
         handleEnvInfoRequest();
         break;
      default:
         console.log("Main process ===> unknow event from app:" + args);
   }
});


const getWssPortHelper = function(portRegPath) {
   let p = new Promise(function(resolve, reject) {
      console.log('getWssPortHelper start to get wssport from root:' + portRegPath);
      let regPath = portRegPath ? portRegPath : gWssPortRegistryPath;
      let wssPortRegistryPath = regPath + sessionId.toString();
      regedit.list(wssPortRegistryPath, function(err, result) {
         if (result && (result[wssPortRegistryPath] && result[wssPortRegistryPath].exists)) {
            console.log(`getWssPortHelper get wssport:${wssPortRegistryPath} value:${JSON.stringify(result[wssPortRegistryPath])}`);
            resolve(result[wssPortRegistryPath].values);
         } else {
            console.log('getWssPortHelper failed to get wssport:' + wssPortRegistryPath);
            reject(err);
         }
      });
   });
   return p;
};

const getWssPortInfo = function() {
   return new Promise(function(resolve, reject){
      getWssPortHelper(gWssPortRegistryPath)
         .then((r)=>resolve(r))
         .catch((e)=>getWssPortHelper(gLegacyWssPortRegistryPath))
         .then((r)=>resolve(r))
         .catch((e)=>reject(e));
   });
};


const handleEnvInfoRequest = async () => {
   let envInfo = {};
   envInfo.type = "envInfo";

   envInfo.callServerUrl = callServerUrl;
   envInfo.disableMultiAudio = disableMultiAudio;
   if (OSType === "win32") {
      // window handle value
      let winHandle = win.getNativeWindowHandle();
      let handleValue =  winHandle.toString('hex');

      envInfo.winHandle = handleValue;

      // clientID
      envInfo.clientID = clientID;

      envInfo.wssPortInfo = await getWssPortInfo();

   }

   win.webContents.send("fromMain", JSON.stringify(envInfo));
};
