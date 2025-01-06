# Horizon WebRTC Redirection sample app and SDK

This repository contains a sample application demonstrating both Electron and web-based usage of the Horizon WebRTC Redirection SDK.

To get started, please refer to the README file located in the ./Sample folder. The provided example manually adds the SDK to script tags; however, you are encouraged to modify it as needed to utilize the published version of the NPM module associated with this repository.

The example serves the HTML and JavaScript files directly.

## Working with GitHub registry

Please refer to this [GitHub article](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry) to authenticate your project and use our public registry.

You will need to create a github token and either authenticate directly or use an .npmrc file within your project. An example .npmrc file is as follows:

```
@euc-releases:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<GITHUB_TOKEN>
```

## Import and use

```
const horizonWebRtcRedir = require('@euc-releases/horizon-webrtc-redir-sdk');

extAPI = horizonWebRtcRedir.HorizonWebRTCExtension
HorizonRedirSDK = horizonWebRtcRedir.HorizonWebRtcRedirectionAPI
```