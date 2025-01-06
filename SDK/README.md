# **Horizon WebRTC Redirection SDK**

## **Overview**
The `HorizonWebRtcRedirectionAPI` provides a set of tools to enable WebRTC redirection features for Horizon environments. It supports peer connections, media stream management, device enumeration, and screen sharing functionalities.

## Installation

Once your .npmrc file is setup you can install the package as follows:

Install via command line
```
npm install @euc-releases/horizon-webrtc-redir-sdk@8.14.0
```

Install via package.json:
```
"@euc-releases/horizon-webrtc-redir-sdk": "8.14.0"
```

## **Requirements**

To ensure proper functionality of the `HorizonWebRtcRedirectionAPI`, the following three functions must be set within the environment. These functions provide essential details required for establishing communication between the client and the WebRTC redirection application.

### **1. `window.getWindowReference`**

```javascript
window.getWindowReference = async () => {};
```

### Purpose:
This function retrieves the window handle (hwnd) for the current application instance. The winHandle is crucial for identifying the window in the WebRTC redirection context. The promise should resolve to the winHandle associated with the application.
- Electron Apps: this value is provided from the envInfo event.
- WebApp: you can initially resolve the promise as '0'. This function will be set by the SDK after initlization

### **2. `window.getHorizonClientID`**

```javascript
window.getHorizonClientID = async () => {};
```

### Purpose:
This function returns the unique clientID for the Horizon client.
- Electron Apps: this value is provided in the envInfo event.
- WebApp: use the HorizonWebRTCExtension.getHorizonClientID() function.


### **2. `window.getHorizonWSSPort`**

```javascript
window.getHorizonWSSPort = async () => {}
```

### Purpose:
Purpose:
This function returns the WebSocket Secure (WSS) port number used for communication between the Horizon environment and the WebRTC redirection application. The port is usually configured as part of the Horizon client setup.
- Electron Apps: this value is provided in the envInfo event.
- WebApp: use the HorizonWebRTCExtension.getHorizonWSSPort() function.


These functions ensure that the necessary client information (window handle, client ID, and WSS port) is accessible to the WebRTC redirection SDK, allowing it to operate seamlessly in the Horizon environment. Without these functions, the SDK cannot establish the required connections or communicate with the Horizon infrastructure.

Please refer to the sample application for example code and use cases.


## **API Reference**

### **Initialization**

#### `initSDK(appLogger, appName, eventCallback, sdkConfig)`
Initializes the SDK for Horizon WebRTC redirection.

**Parameters**:
- `appLogger` *(Object)*: Logger for the application.
- `appName` *(String)*: Name of the application.
- `eventCallback` *(Function)*: Callback for handling vdiClientConnected and vdiClientDisconnected events.
- `sdkConfig` *(Object, optional)*: Configuration options, including `numOfCallConfigs`.

**Returns**: *(Boolean)* `true` if initialization succeeds, `false` otherwise.

---

#### `getCallConfig(index)`
Helper function that processes configurations and returns `pcfId`.

**Parameters**:
- `index` *(Number)*: Index of the call configuration.

**Returns**: *(Object)* `pcfId`.

---

#### `getWindowHandleForWebApp()`
Function that returns the hwnd for the current tab. The tab must be unique, use onTitleChanged to ensure the correct title is tracked.

**Returns**: *(Promise)* Resolves with the hwnd once it's retrieved from the server.

---

#### `newPeerConnection(arg1, arg2)`
This function should connect to the Thin Client to create a real RTCPeerConnection object. It should return an object with the same interface as RTCPeerConnection whose methods will be used to communicate to the RTCPeerConnection on the ThinClient. If the ThinClient does not support remote connections this function should return an instance of an unshimmed RTCPeerConnection.

**Parameters**:
- `arg1` *(Object)*: RTC configuration.
- `arg2` *(Object)*: RTC options.

**Returns**: *(Object)* A redirection-enabled `RTCPeerConnection`.

---

#### `newMediaStream(tracks)`
Creates a new media stream object.

**Parameters**:
- `tracks` *(Array)*: Array of media tracks to include in the stream.

**Returns**: *(MediaStream)* A media stream object.

---

#### `getDisplayMedia(constraints)`
Initiates screen sharing based on given constraints.

**Parameters**:
- `constraints` *(Object)*: Media constraints.

**Returns**: *(Promise)* Resolves with a `MediaStream` object.

---

#### `getUserMedia(constraints)`
Fetches user media (camera/microphone) streams.

**Parameters**:
- `constraints` *(Object)*: Media constraints.

**Returns**: *(Promise)* Resolves with a `MediaStream` object.

---

#### `enumerateDevices()`
Lists all available media devices.

**Returns**: *(Promise)* Resolves with an array of device information objects.

---


#### `setSinkId(audioId, sinkId)`
Assigns an audio sink to a specific audio track.

**Parameters**:
- `audioId` *(String)*: ID of the audio track.
- `sinkId` *(String)*: ID of the audio sink.

---

#### `setPrimarySinkId(sinkId)`
Sets the default audio sink.

**Parameters**:
- `sinkId` *(String)*: ID of the audio sink.

---

#### `onScreenSelected(screenId)`
Sets the preferred screen for sharing.

**Parameters**:
- `screenId` *(String)*: ID of the selected screen.

---

#### `onWindowSessionConnected(state)`
Handles Windows session state changes (e.g., lock/unlock).

**Parameters**:
- `state` *(Boolean)*: `true` for connected/unlocked, `false` for disconnected/locked.

---

#### `playRingtone(id, src, isLoop)`
Plays a notification sound remotely.

**Parameters**:
- `id` *(String)*: Identifier for the ringtone.
- `src` *(String)*: Source URL of the audio file.
- `isLoop` *(Boolean)*: Whether the sound should loop.

---

#### `pauseRingtone(id)`
Pauses the currently playing notification sound.

**Parameters**:
- `id` *(String)*: Identifier of the ringtone to pause.

---

#### `isFeatureSupported(feature)`
Checks if a specific WebRTC feature is supported.

**Parameters**:
- `feature` *(String)*: Name of the feature (e.g., `datachannel`).

**Returns**: *(Boolean)* `true` if the feature is supported, otherwise `false`.

---

#### `setVideoClipRegion(isAdd, clipRegion, window)`
Adds or removes a clipping region for video rendering.

**Parameters**:
- `isAdd` *(Boolean)*: `true` to add, `false` to remove.
- `clipRegion` *(Object)*: Object defining the clip region.
- `window` *(Object)*: Associated window object.

---

#### `onAudioCreated(audioElem, window)`
Creates an equivalent audio element on the Thin Client. Intercepts `srcObject` and `sinkId` updates to propagate changes to the Thin Client.

**Parameters**:
- `audioElem` *(HTMLAudioElement)*: The audio element created by the application.
- `window` *(Object)*: The associated window object.

---

#### `onAudioDisposed(audioElem, window)`
Handles the disposal of an audio element.

**Parameters**:
- `audioElem` *(HTMLAudioElement)*: The audio element being destroyed.
- `window` *(Object)*: The associated window object.

---

#### `onVideoCreated(videoElem, window)`
Creates an equivalent video element on the Thin Client. Intercepts updates to properties like `srcObject`, `sinkId`, and styling changes.

**Parameters**:
- `videoElem` *(HTMLVideoElement)*: The video element created by the application.
- `window` *(Object)*: The associated window object.

---

#### `onVideoDisposed(videoElem, window)`
Handles the disposal of a video element.

**Parameters**:
- `videoElem` *(HTMLVideoElement)*: The video element being destroyed.
- `window` *(Object)*: The associated window object.

---

#### `getReceiverCapabilities(kind)`
Returns the capabilities of an `RTCRtpReceiver` for a specific media kind (e.g., `audio`, `video`).

**Parameters**:
- `kind` *(String)*: The type of media (e.g., `audio`, `video`).

**Returns**: *(Object)* The capabilities object.

---

#### `getScreensInfo()`
Fetches information about available screens for sharing.

**Returns**: *(Promise)* Resolves with an array of screen objects.

---

#### `onScreenSelected(screenId)`
Sets the preferred screen for sharing.

**Parameters**:
- `screenId` *(String)*: ID of the selected screen.


# **Horizon WebRTC Redirection Extension API**

## **Overview**
The `HorizonWebRTCExtension` provides two getters for values needed by the WebApp use case. These functions should only be used to set the required windows functions used by the SDK.

## **API Reference**

#### `getHorizonClientID()`
Retrieves the ClientID from the html5server.

**Returns**: *(Promise)* A promise that will resolve with the ClientID as a string

---

#### `getHorizonWSSPort()`
Retrieves the wss port from the html5server needed for websocket communication

**Returns**: *(Promise)* Resolves with the wss port as a string.

---