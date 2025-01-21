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

### Import from NPM directly
```
const horizonWebRtcRedir = require('@euc-releases/horizon-webrtc-redir-sdk');

extAPI = horizonWebRtcRedir.HorizonWebRTCExtension
HorizonRedirSDK = horizonWebRtcRedir.HorizonWebRtcRedirectionAPI
```
### Copy files from modules

Grab `HorizonSDKforWebRTCRedir.js` and `HorizonWebRTCExtension.js` from your node_modules folder and copy them to the sample apps sdk folder as instructed.

```
node_modules\@euc-releases\horizon-webrtc-redir-sdk
```
## License

This software is licensed under the [Omnissa Software Development Kit (SDK) License Agreement](https://static.omnissa.com/sites/default/files/omnissa-sdk-agreement.pdf); you may not use this software except in compliance with the License.

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

## Support

If there is a partner program or Certification Program related to the Software, then Omnissa may, but is not obligated to, provide you with limited support services for the Software in accordance with the terms of those programs. Otherwise, you are not entitled under this Agreement to receive any Omnissa support or subscription services for the Software or any other services from Omnissa in connection with the Software. … If you have purchased support and/or subscription services for an Omnissa product, such support and/or subscription services shall not apply to the Software or your use of the Software other than as provided in any relevant Certification Program.
