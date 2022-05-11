export const QBconfig = {
  credentials: {
    appId: '11',
    authKey: 'zRdcsO6sQ4SdMwM',
    authSecret: 'C5qWqUOCX75ujsD',
    accountKey: 'WuJdcAsDLBP3zfwRQ8qj'
  },
  appConfig: {
    endpoints: {
      api: "apititanium.quickblox.com", // set custom API endpoint
      chat: "chattitanium.quickblox.com", // set custom Chat endpoint
    },
    chatProtocol: {
      active: 2
    },
    streamManagement: {
      enable: true
    },
    debug: {
      mode: 1,
      file: null
    }
  }
};

export const CONSTANTS = {
  DIALOG_TYPES: {
    CHAT: 3,
    GROUPCHAT: 2,
    PUBLICCHAT: 1
  },
  ATTACHMENT: {
    TYPE: 'image',
    BODY: '[attachment]',
    MAXSIZE: 2 * 1000000, // set 2 megabytes,
    MAXSIZEMESSAGE: 'Image is too large. Max size is 2 mb.'
  },
  ATTACHMENT_VIDEO :{
    TYPE: 'video',
    BODY: '[attachment]',
    MAXSIZE: 5 * 1000000, // set 5 megabytes,
    MAXSIZEMESSAGE: 'Video is too large. Max size is 5 mb.'
  },
  ATTACHMENT_PDF :{
    TYPE: 'type',
    BODY: '[attachment]',
    MAXSIZE: 5 * 1000000, // set 5 megabytes,
    MAXSIZEMESSAGE: 'PDf is too large. Max size is 5 mb.'
  },
  ATTACHMENT_DOCX :{
    TYPE: 'type',
    BODY: '[attachment]',
    MAXSIZE: 5 * 1000000, // set 5 megabytes,
    MAXSIZEMESSAGE: 'Document is too large. Max size is 5 mb.'
  },
  ATTACHMENT_XLSX :{
    TYPE: 'type',
    BODY: '[attachment]',
    MAXSIZE: 5 * 1000000, // set 5 megabytes,
    MAXSIZEMESSAGE: 'Document is too large. Max size is 5 mb.'
  },
  NOTIFICATION_TYPES: {
    NEW_DIALOG: '1',
    UPDATE_DIALOG: '2',
    LEAVE_DIALOG: '3'
  },
  SYSTEM_MSG_KEY : {
    KEY : "SysMsgKey",
    NEW_DIALOG : "SysMsgNewGroupDialog",
    UPDATE_DIALOG : "SysMsgUpdateGroupDialog",

    GROUP_CALL_START : "SysMsgGroupCall",
    GROUP_CALL_END : "SysMsgGroupCallEnd",
    GROUP_CALL_RECEIVED : "SysMsgGroupCallReceived"
    
  }
};
