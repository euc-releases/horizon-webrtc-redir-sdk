/*
 * Copyright (c) Omnissa, LLC. All rights reserved.
 * This product is protected by copyright and intellectual property laws in the
 * United States and other countries as well as by international treaties.
 * -- Omnissa Restricted
 */

const Utils = {};

Utils.stopStream = function(stream) {
   if (!stream) {
      return;
   }
   stream.getTracks().forEach(track => {
      track.stop();
   });
};

Utils.log = function(moduleName, text) {
   console.log(moduleName + " ==> " + text);
};

Utils.logWarn = function(moduleName, text) {
   console.warn(moduleName + " ==> " + text);
};

Utils.logError = function(moduleName, text) {
   console.error(moduleName + " ==> " + text);
};

Utils.getRandomNumber = function() {
   return Math.ceil(Date.now() * Math.random());
}

export default Utils;
