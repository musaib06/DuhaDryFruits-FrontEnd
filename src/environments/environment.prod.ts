export const environment = {
  appVersion: '0.0.0',
  production: true,
  apiResponseCacheTimeoutInMinutes: 5,
  enableResponseCacheProcessing: true,
  applicationVersion: '0.0.1',
  apiBaseUrl: 'https://api.wildvalleyfoods.in',
  apiDefaultTimeout: 10,
  indexedDBName: 'WildValleyFoodsDB',
  indexedDBVersion: 1,
  LoggingInfo: {
    cacheLogs: false,
    cacheLogsToConsole: true,
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

  blogShare: {
    facebook: true,
    twitter: true,
    linkedin: true,
    whatsAppNumber: '917738899165',
  },

  firebase: {
    apiKey: 'AIzaSyATpeXmdGLK4y40ljotQ9ZVyqkB0tblQLM',
    authDomain: 'wild-valley-4c7a5.firebaseapp.com',
    projectId: 'wild-valley-4c7a5',
    storageBucket: 'wild-valley-4c7a5.firebasestorage.app',
    messagingSenderId: '943411759123',
    appId: '1:943411759123:web:41437dac8a4cb540bf97e6',
    measurementId: 'G-PCPQVPF9K3',
    // Web Push certificate public key (VAPID). Copy it from
    // Firebase Console → Project Settings → Cloud Messaging →
    // "Web Push certificates". Required for the browser to obtain an FCM token.
    vapidKey: 'BNDFH1Acv96ywyjBbT36rv_TmIbByD7tRM_B1FWKGtuUqzHgBiowcg_9DAf8VpmKmy4h37odnsfTNtoLfbV_zgo'
  }
};
