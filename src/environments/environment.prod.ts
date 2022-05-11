//const baseUrl = 'http://65.0.212.242:5500'; // Dev stable
const baseUrl = 'https://titaniumsecure.io:5500' // live 

export const environment = {
  production: true,
  baseUrl,
  baseApiUrl: `${baseUrl}/api/`,
  apiSecretKey: 'acwa3pdd2k5eluh5',
  firebaseConfig : {
    apiKey: "AIzaSyDl5ryJ1kXwLYAUUdPTV8c2vzb1hSwaKJo",
    authDomain: "titanium-6a871.firebaseapp.com",
    projectId: "titanium-6a871",
    storageBucket: "titanium-6a871.appspot.com",
    messagingSenderId: "138843822627",
    appId: "1:138843822627:web:5f081e39ef7f3254286f96",
    measurementId: "G-T41JM15BQX"
  },
  // Live/ production build QB credntial
  QBCredentials : {
    appId: 10,
    authKey: 'KXPWszW5M77NpeK',
    authSecret: 'p-mfueKphQ23fwH',
    accountKey: 'WuJdcAsDLBP3zfwRQ8qj'
  },
  QBConfig : { 
    endpoints: {
      api: "apititanium.quickblox.com", // set custom API endpoint
      chat: "chattitanium.quickblox.com", // set custom Chat endpoint
    },
    webrtc: {
      answerTimeInterval: 60,
      dialingTimeInterval: 4
    },
    chatProtocol: {
      active: 2
    },
    streamManagement: {
      enable: true
    },
    debug: false
  },
  conferenceConfig : {
    server: "wss://groupcallstitanium.quickblox.com",
    debug: false, // optional
    iceServers: [{
      'url': 'stun:turntitanium.quickblox.com'
    },
    {
      'url': 'stun:turntitanium.quickblox.com',
      'username': 'quickblox',
      'credential': 'baccb97ba2d92d71e26eb9886da5f1e0'
    },
    {
      'url': 'turn:turntitanium.quickblox.com?transport=udp',
      'username': 'quickblox',
      'credential': 'baccb97ba2d92d71e26eb9886da5f1e0'
    },
    {
      'url': 'turn:turntitanium.quickblox.com?transport=tcp',
      'username': 'quickblox',
      'credential': 'baccb97ba2d92d71e26eb9886da5f1e0'
    }], // optional
  },
  // Test app google api key and client id, Do not use in production. Replace this with client's cred
  
  google_api_key : '371373515609-fgkb404kmu556qmlchcjthvmc2dpis1g.apps.googleusercontent.com',
  google_client_id : 'AIzaSyCwlNahspIs7tzkQIrCu_95unvnzl7WDfY',
};
