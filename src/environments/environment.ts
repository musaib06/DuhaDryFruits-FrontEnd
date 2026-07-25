// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  appVersion: '0.0.0',
  production: false,
  apiResponseCacheTimeoutInMinutes: 5,
  enableResponseCacheProcessing: true,
  applicationVersion: '0.0.1',

  apiBaseUrl: 'https://api.duhadryfruits.com',
  // apiBaseUrl: 'http://localhost:8081',

  apiDefaultTimeout: 20,
  indexedDBName: 'DuhaDryFruitsDB',
  indexedDBVersion: 1,

  LoggingInfo: {
    cacheLogs: true,
    logToConsole: true,
    logToFile: false,
    logToApi: false,
    logToElasticCluster: false,
    exceptionToConsole: true,
    exceptionToFile: false,
    exceptionToApi: false,
    exceptionToElasticCluster: false,
    localLogFilePath: 'Sample.log',
  },
  encryptionKey: '12345678',

  /**
   * Blog article share buttons. Set platform to false to hide.
   * whatsAppNumber: digits with country code only (e.g. 919796764475). Empty = hide WhatsApp.
   */
  blogShare: {
    facebook: true,
    twitter: true,
    linkedin: true,
    whatsAppNumber: '919796764475',
  },

  /**
   * Firebase Configuration for Push Notifications
   */
  firebase: {
    apiKey: 'AIzaSyCUr9Jdfn3QkAm8KweU0HyEA2E595triQs',
    authDomain: 'notify-129ad.firebaseapp.com',
    projectId: 'notify-129ad',
    storageBucket: 'notify-129ad.firebasestorage.app',
    messagingSenderId: '526081196460',
    appId: '1:526081196460:web:cc1789fb6ecf4ecce0ba09',
    measurementId: 'G-8D1EPRWT5X',
    // Web Push certificate public key (VAPID). Copy it from
    // Firebase Console → Project Settings → Cloud Messaging →
    // "Web Push certificates". Required for the browser to obtain an FCM token.
    vapidKey: 'BFmaTxX79dWjTEbSb7CzhnNY20gm9yAksL_gLjMHu4tO_vP4dbPWjq8nkLYTaF2bUjUC9qlDRTWmkOgdHyrC9y4'
  }
};
