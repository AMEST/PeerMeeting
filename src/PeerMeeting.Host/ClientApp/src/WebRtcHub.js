// Copyright 2021 Klabukov Erik.
// SPDX-License-Identifier: GPL-3.0-only

import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
/* eslint-disable */
// Custom SignalR connection handler
function WebRtcSignalR (connection, connectCallback) {
  try{
  var signalRConnection = new HubConnectionBuilder()
    .withUrl('/ws/webrtc')
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build()
  }catch(e){console.error(e)}

  function isData (session) {
    return !session.audio && !session.video && !session.screen && session.data
  }

  var channelName = connection.channel || 'defaultRoom'

  connection.socket = {
    send: function (data) {
      signalRConnection.invoke('Send', channelName, JSON.stringify(data))
    }
  }
  signalRConnection.on(channelName, message => {
    var data = JSON.parse(message)
    console.log('ON Deserialized', data)

    switch(data.eventName){
      case connection.socketMessageEvent:
        onMessagesCallback(data.data)
        break
      case 'presence':
        data = data.data
        if (data.userid === connection.userid) return
        connection.onUserStatusChanged({
          userid: data.userid,
          status: data.isOnline === true ? 'online' : 'offline',
          extra: connection.peers[data.userid] ? connection.peers[data.userid].extra : {}
        })
        break
      case 'extra-data-updated':
        if(connection.userid === data.data.remoteUserId) return
        if(!connection.peers[data.data.remoteUserId] || !data.data.extra) return
        connection.peers[data.data.remoteUserId].extra = data.data.extra
        connection.onExtraDataUpdated({
          userid: data.data.remoteUserId,
          extra: data.data.extra
        })
        break
      case 'renegotiate-needed':
        if(connection.userid !== data.data.remoteUserId) return
        if(!connection.peers[data.data.sender]) return
        connection.renegotiate(data.data.sender)
        break
    }
  })
  signalRConnection.onreconnected(connectionId => {
    console.log('signalr reconnected. state' + signalRConnection.state);
    signalRConnection.invoke('JoinRoom', channelName).then(function(){
      connection.socket.emit('presence', {
        userid: connection.userid,
        isOnline: true
      })
    })
  });
  // start the hub
  signalRConnection.start().then(function () {
    if (connection.enableLogs) {
      console.info('SignalR connection is opened.')
    }
    signalRConnection.invoke('JoinRoom', channelName).then(function(){

      connection.socket.emit('presence', {
        userid: connection.userid,
        isOnline: true
      })

      if (connectCallback) connectCallback(connection.socket)
    })
  }).catch( e => {
    console.error('Error while establishing connection. Error: ' + e.message)
    console.error(JSON.stringify(e, Object.getOwnPropertyNames(e)))
    alert(JSON.stringify(e, Object.getOwnPropertyNames(e)))
  })

  connection.socket.emit = function (eventName, data, callback) {
    if (eventName === 'changed-uuid') return
    if (data.message && data.message.shiftedModerationControl) return

    if (eventName === 'extra-data-updated'){
      data = {
        extra: data,
        remoteUserId: connection.userid
      }
    }

    connection.socket.send({
      eventName: eventName,
      data: data
    })

    if (callback) {
      callback = callback || function () { }

      if (eventName === 'open-room' || eventName === 'join-room'){
        callback(true, null)
      } else {
        callback()
      }
    }
  }

  var mPeer = connection.multiPeersHandler

  function onMessagesCallback (message) {
    if (message.remoteUserId !== connection.userid && !message.message.newParticipationRequest) return

    if (connection.peers[message.sender] && connection.peers[message.sender].extra !== message.message.extra 
      && message.message.extra) {
      connection.peers[message.sender].extra = message.message.extra
      connection.onExtraDataUpdated({
        userid: message.sender,
        extra: message.message.extra
      })
    }

    if (message.message.streamSyncNeeded && connection.peers[message.sender]) {
      var stream = connection.streamEvents[message.message.streamid]
      if (!stream || !stream.stream) {
        return
      }

      var action = message.message.action

      if (action === 'ended' || action === 'inactive' || action === 'stream-removed') {
        if (connection.peersBackup[stream.userid]) {
          stream.extra = connection.peersBackup[stream.userid].extra
        }
        connection.onstreamended(stream)
        return
      }

      var type = message.message.type !== 'both' ? message.message.type : null

      if (typeof stream.stream[action] === 'function') {
        stream.stream[action](type)
      }
      return
    }

    if (message.message === 'dropPeerConnection') {
      connection.deletePeer(message.sender)
      return
    }

    if (message.message.allParticipants) {
      if (message.message.allParticipants.indexOf(message.sender) === -1) {
        message.message.allParticipants.push(message.sender)
      }

      message.message.allParticipants.forEach(function (participant) {
        mPeer[!connection.peers[participant] ? 'createNewPeer' : 'renegotiatePeer'](participant, {
          localPeerSdpConstraints: {
            OfferToReceiveAudio: connection.sdpConstraints.mandatory.OfferToReceiveAudio,
            OfferToReceiveVideo: connection.sdpConstraints.mandatory.OfferToReceiveVideo
          },
          remotePeerSdpConstraints: {
            OfferToReceiveAudio: connection.session.oneway ? !!connection.session.audio : connection.sdpConstraints.mandatory.OfferToReceiveAudio,
            OfferToReceiveVideo: connection.session.oneway ? !!connection.session.video || !!connection.session.screen : connection.sdpConstraints.mandatory.OfferToReceiveVideo
          },
          isOneWay: !!connection.session.oneway || connection.direction === 'one-way',
          isDataOnly: isData(connection.session)
        })
      })
      return
    }

    if (message.message.newParticipant) {
      if (message.message.newParticipant === connection.userid) return
      if (connection.peers[message.message.newParticipant]) return

      mPeer.createNewPeer(message.message.newParticipant, message.message.userPreferences || {
        localPeerSdpConstraints: {
          OfferToReceiveAudio: connection.sdpConstraints.mandatory.OfferToReceiveAudio,
          OfferToReceiveVideo: connection.sdpConstraints.mandatory.OfferToReceiveVideo
        },
        remotePeerSdpConstraints: {
          OfferToReceiveAudio: connection.session.oneway ? !!connection.session.audio : connection.sdpConstraints.mandatory.OfferToReceiveAudio,
          OfferToReceiveVideo: connection.session.oneway ? !!connection.session.video || !!connection.session.screen : connection.sdpConstraints.mandatory.OfferToReceiveVideo
        },
        isOneWay: !!connection.session.oneway || connection.direction === 'one-way',
        isDataOnly: isData(connection.session)
      })
      return
    }

    if (message.message.readyForOffer) {
      if (connection.attachStreams.length) {
        connection.waitingForLocalMedia = false
      }

      if (connection.waitingForLocalMedia) {
        // if someone is waiting to join you
        // make sure that we've local media before making a handshake
        setTimeout(function () {
          onMessagesCallback(message)
        }, 1)
        return
      }
    }

    if (message.message.newParticipationRequest && message.sender !== connection.userid) {
      if (connection.peers[message.sender]) {
        connection.deletePeer(message.sender)
      }

      var userPreferences = {
        extra: message.extra || {},
        localPeerSdpConstraints: message.message.remotePeerSdpConstraints || {
          OfferToReceiveAudio: connection.sdpConstraints.mandatory.OfferToReceiveAudio,
          OfferToReceiveVideo: connection.sdpConstraints.mandatory.OfferToReceiveVideo
        },
        remotePeerSdpConstraints: message.message.localPeerSdpConstraints || {
          OfferToReceiveAudio: connection.session.oneway ? !!connection.session.audio : connection.sdpConstraints.mandatory.OfferToReceiveAudio,
          OfferToReceiveVideo: connection.session.oneway ? !!connection.session.video || !!connection.session.screen : connection.sdpConstraints.mandatory.OfferToReceiveVideo
        },
        isOneWay: typeof message.message.isOneWay !== 'undefined' ? message.message.isOneWay : !!connection.session.oneway || connection.direction === 'one-way',
        isDataOnly: typeof message.message.isDataOnly !== 'undefined' ? message.message.isDataOnly : isData(connection.session),
        dontGetRemoteStream: typeof message.message.isOneWay !== 'undefined' ? message.message.isOneWay : !!connection.session.oneway || connection.direction === 'one-way',
        dontAttachLocalStream: !!message.message.dontGetRemoteStream,
        connectionDescription: message,
        successCallback: function () { }
      }

      connection.onNewParticipant(message.sender, userPreferences)
      return
    }

    if (message.message.changedUUID) {
      if (connection.peers[message.message.oldUUID]) {
        connection.peers[message.message.newUUID] = connection.peers[message.message.oldUUID]
        delete connection.peers[message.message.oldUUID]
      }
    }

    if (message.message.userLeft) {
      mPeer.onUserLeft(message.sender)

      if (message.message.autoCloseEntireSession) {
        connection.leave()
      }

      //Patch for deleting perticipant block on firefox
      if (connection.DetectRTC.browser.name === 'Firefox'
          || !connection.peers[message.sender]){
        connection.onstreamended({streamid: null, userid: message.sender})
      }

      return
    }

    mPeer.addNegotiatedMessage(message.message, message.sender)
  }
}
export default WebRtcSignalR
