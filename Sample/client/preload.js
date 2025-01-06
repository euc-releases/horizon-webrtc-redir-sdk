/*
 * Copyright (c) Omnissa, LLC. All rights reserved.
 * This product is protected by copyright and intellectual property laws in the
 * United States and other countries as well as by international treaties.
 * -- Omnissa Restricted
 */

const {
   contextBridge,
   ipcRenderer,
   desktopCapturer
} = require("electron");

contextBridge.exposeInMainWorld(
   "api", {
      send: (channel, data) => {
         let validChannels = ["toMain"];
         if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
         }
      },
      receive: (channel, func) => {
         let validChannels = ["fromMain"];
         if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
         }
      }
   }
);

contextBridge.exposeInMainWorld(
   "electronGetDisplayMedia", async () => {
      const sources = await desktopCapturer.getSources({
         types: ["window", "screen"],
      });
      const selectedSource = sources[0];
      return selectedSource;
   }
);
