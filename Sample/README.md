# Sample Electron and Web App for Omnissa Horizon WebRTC Redirection SDK

## Disclaimer
### This sample application(including both client and server) is not an official Omnissa product.
### The sample application itself does not contain any open source or third-party source code or library.
### To build and run the application, you might need some NodeJS packages(with their own licenses) which are specified in those 'package.json' files. But you could have you own implementation as well.

There are four components to the sample app.
-The httpServer serves the static content for the app.
-The sigServer handles the user logins and connections.
-The client runs an electron instance and loads info from both httpServer and sigServer.
-The chrome extension if you are running the web based application. This is not needed for the electron client.

The httpServer and sigServer only need to be hosted in one place and can be hosted on the same machine.
The client has to be run for each peer you want to call from (likely a minimum of two).
The httpServer and sigServer can run on the same machine as one of the clients.
All of the electron clients need to be given information on where the servers are (detailed below in the client setup section).
The web based app will access the client from a chrome browser using the IP address of the machine running the httpServer.

## How to run

### Set up your httpServer
0. Make sure you have NodeJS(latest stable version will be good enough) installed in your environment. For the httpServer you can also use any other statically hosting solution.
1. Copy the httpServer folder to the location you want to host.
2. Copy the folders 'sdk' into httpServer folder.
3. Gather a certificate, self signed is fine and place it into a folder called 'certs'. The final hierarchy should look like this:

├── httpServer
   ├── httpServer.js
   ├── index.html
   ├── common
      ├── constant.js
   ├── sdk
      ├── HorizonSDKforWebRTCRedir.js
   ├── app
├── certs
   ├── cert.pem
   ├── key.pem

4. Enter the ./httpServer folder and run 'npm install' then 'npm start' (or node httpServer.js)

### Set up your signaling server
0. Make sure you have NodeJS(latest stable version will be good enough) installed in your environment.
1. Copy the 'sigServer' to the location you want to start.
2. Gather a certificate, self signed is fine and place it into a folder called 'certs'. copy the certs folder next to the sigServer
3. The final hierarchy should look like this:
├── sigServer
   ├── wsServer.js
   ├── user.js
   ├── package.json
   ├── common
      ├── constant.js
├── certs
   ├── cert.pem
   ├── key.pem
4. Enter ./sigServer folder, execute: 'npm install' and then 'npm start' (or node wsServer.js)


### Your httpServer and signaling server could be the same machine and share same pair of key and certificate.

### Configure electron client and run
0. Make sure you have NodeJS(latest stable version will be good enough) installed in your environment.
1. Copy client folder to wherever you want
2. Set the link url for index page in ‘client/serverInfo.json’. depends on how you configure your web server in steps above. Example: "pageUlr": "https://192.168.1.101/sample/index.html"
3. Set the Web Socket server ulr for ‘callServerUrl’ in ‘client/ serverInfo.json’, depends on how you configure your web socket server in steps above. Example: "callServerUrl": “wss://192.168.1.200:8443”
4. The final hierarchy should look like this
├── client
   ├── main.js
   ├── preload.js
   ├── package.json
   ├── serverInfo.json
5. Enter ./client folder, execute: 'npm install' and then 'npm start'

### Configure web client and run
0. Launch chrome browser and natigate to the url 
1. Add the Horizon WebRTC SDK browser extension to your chrome browser.
2. Note the IP address of your httpServer and the signaling server that will be used in step 4
3. Configure the following registry keys.
- [HKLM\SOFTWARE\Policies\Omnissa\Horizon\WebRTCRedirSDKWebApp] "enabled"=dword:00000001
- [HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Omnissa\Horizon\WebRTCRedirSDKWebApp\UrlAllowList] "https://httpServerIpAddress:3000/*"=""
4. Close and reopen the VM then navigate to https://httpServerIpAddress:3000/webIndex.html?callServerUrl=wss://signalingServerIpAddress:8443


### You can also build the client app as a regular Electron App: https://www.electronjs.org/docs/latest/tutorial/quick-start#package-and-distribute-your-application


### Make a call
1. If you are running the app on VDI environment, it will try to connected to Horizon Agent automatically. And once it get connected, a green label will show the status. If you see a red label, it did not connect.
2. Clicking 'Get Device List' button could get list of local audio/video devices.
3. Clicking 'Get Self View' button could get a preview of youself if you have available camera.
4. Input a string as your user name and click 'Login' button. It will make connected to the web socket server in the step above.
5. Type in another user's name and click 'Call' button.

#### In step 4, if you use same user name to login, the previous one will be disconnected automatically.
#### In step 5, you should have an different user use the same app login and ready to answer the call.
