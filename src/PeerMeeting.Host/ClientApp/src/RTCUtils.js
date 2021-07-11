// Copyright 2021 Klabukov Erik.
// SPDX-License-Identifier: GPL-3.0-only

/* eslint-disable */
var RTCUtils = {
  ConfigureBase: function (connection, participants, deviceSettings,  streamEndedCallback = (event) =>{}) {
    var self = this
    connection.codecs.video = 'VP8'
    connection.session = {
      audio: true,
      video: true
    }
    
    this.ConfigureMediaConstraints(connection, deviceSettings)

    connection.sdpConstraints.mandatory = {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true
    }

    // Custom on stream ended event
    connection.onstreamended = function (event) {
      streamEndedCallback(event)
      var mediaElement = document.getElementById(event.streamid)
      if (mediaElement) {
        mediaElement.parentNode.removeChild(mediaElement)
      }
    }
    
    // Fix for clear participant cards who disconnected without event
    setInterval(() =>{
      var connectedParticipants = connection.getAllParticipants()
      for(const key of participants.keys()){
        if(connectedParticipants.indexOf(key) == -1 
          && connection.userid != key
          || (connection.peers[key] 
            && connection.peers[key].peer.connectionState === "failed"))
          streamEndedCallback({userid: key})
      }
    }, 5000)
    // Fix peer connections without cards
    setInterval(() =>{
      connection.peers.getAllParticipants().forEach( e =>{
        if(!participants.has(e) 
          && connection.peers[e]
          && connection.peers[e].peer
          && connection.peers[e].peer.connectionState
          && connection.peers[e].peer.connectionState === "connected"){

            if(!connection.peers[e].peer.participantCardError)
              connection.peers[e].peer.participantCardError = 0
            connection.peers[e].peer.participantCardError += 1

            if(connection.peers[e].peer.participantCardError > 6){
              connection.onstream({
                streamid: null,
                userid: e,
                extra: connection.peers[e].extra,
                cardfix: true,
                mediaElement: document.createElement("div"),
              })
              connection.peers[e].peer.participantCardError = 0
            }
        }else{
          connection.peers[e].peer.participantCardError = 0
        }
      })
      if(!participants.has(connection.userid)){
        if(!connection.selfCardError)
          connection.selfCardError = 0

        connection.selfCardError += 1
        if(connection.selfCardError > 6){
          self.CreateFakeStream(connection, connection.multiPeersHandler, connection.onstream)
          connection.selfCardError = 0
        }
      }else{
        connection.selfCardError = 0
      }
    }, 2000)

    // overriding the event to replace the poster XD
    connection.onmute = function(e) {
      if (!e || !e.mediaElement) return
      if (e.muteType === 'both' || e.muteType === 'video') {
          e.mediaElement.hidden = true
      } else if (e.muteType === 'audio') {
          e.mediaElement.muted = true;
      }
    };

    // Overriding the event for fix mute local media element after unmute on all
    var originalOnUnmute = connection.onunmute
    connection.onunmute = function(e){
      originalOnUnmute(e)
      if(!e || !e.mediaElement) return
      if(e.userid == connection.userid)
        e.mediaElement.muted = true
      if(e.mediaElement.tagName == "VIDEO" && e.unmuteType == 'video')
        e.mediaElement.hidden = false
    }

    connection.onspeaking = function(e){
      console.info('Speacking', e)
      connection.extra.speacking = true
      connection.updateExtraData()
    }
    
    connection.onsilence = function(e) {
      console.info('Silence', e)
      connection.extra.speacking = false
      connection.updateExtraData()
    }

  },
  ConfigureMediaConstraints: function(connection, deviceSettings){
    connection.mediaConstraints = {
      audio: deviceSettings.audioInput 
        ? { deviceId: deviceSettings.audioInput }
        : true,
      video: deviceSettings.videoInput 
        ? { deviceId: deviceSettings.videoInput }
        : true
    }
  },
  // Configure media error event for try use another microfon or if webcam not available, connect without it
  // eslint-disable-next-line
  ConfigureMediaError: function (connection, DetectRTC, deviceSettings, callback = (videoState, audioState) => { }) {
    connection.onMediaError = function (e) {
      var mPeer = connection.multiPeersHandler
      console.error('Media Error', e.message)

      //If all media device unvailable or not allowed
      if (e.message === 'Requested device not found' 
          || e.message === 'The object can not be found here.'
          || e.message === 'The request is not allowed by the user agent or the platform in the current context.'){
        connection.dontCaptureUserMedia = true
        callback(false, false)
        if(connection.getAllParticipants().length <= 0 )
          connection.join(connection.sessionid)
        else
          connection.renegotiate()
        return
      }

      // Fix Mic cuncurrent limit
      if (e.message === 'Concurrent mic process limit.') {
        if (DetectRTC.audioInputDevices.length <= 1) {
          alert(
            'Please select external microphone. Check github issue number 483.'
          )
          return
        }
        var secondaryMic = DetectRTC.audioInputDevices[1].deviceId
        connection.mediaConstraints.audio = {
          deviceId: secondaryMic
        }
        if(connection.getAllParticipants().length <= 0 )
          connection.join(connection.sessionid)
        else
          connection.renegotiate()
        return
      }

      // Case if webcam not available
      callback(false, true)
      connection.dontCaptureUserMedia = true
      var audioDevice = deviceSettings.audioInput ? {deviceId: deviceSettings.audioInput} : true
      navigator.getUserMedia(
        { audio: audioDevice, video: false },
        function (stream) {
          connection.addStream(stream)
          mPeer.onGettingLocalMedia(stream)
          if(connection.getAllParticipants().length <= 0 )
            connection.join(connection.sessionid)
          else
            connection.renegotiate()
        },
        function () { }
      )
    }
  },
  // Switch mute/unmute audio
  SwitchAudioMute: function(connection, state){
    connection.attachStreams.forEach( s =>{
      if(state)
        s.unmute("audio")
      else
        s.mute("audio")

      connection.extra.audioMuted = !state
      connection.updateExtraData()
    })
  },
  // Switch mute/unmute video
  SwitchVideoMute: function(connection, state){
    connection.attachStreams.forEach( s =>{
      if(state)
        s.unmute("video")
      else
        s.mute("video")
      
      connection.extra.videoMuted = !state
      connection.updateExtraData()
    })
  },
  // Start screen sharing or stop and back to video + audio or audio only or empty
  ScreenSharing: function (connection, state, mediaState, deviceSettings, callback){
    connection.attachStreams.forEach(s => s.stop())
    console.log(connection.attachStreams)
    var mPeer = connection.multiPeersHandler
    var self = this
    if(state){
      //Getting screen stream with system audio
      navigator.mediaDevices.getDisplayMedia({video: true, audio: true})
      .then(function(screenStream){
        if(!mediaState.hasMicrophone){
          self.AddStream(connection, screenStream, mPeer, callback)
          return
        }
        //On succes getting microphone stream, for add to screen stream
        var audioDevice = deviceSettings.audioInput ? {deviceId: deviceSettings.audioInput} : true
        navigator.getUserMedia(
          { audio: audioDevice, video: false },
          function (microphoneStream) {
            screenStream.addTrack(microphoneStream.getAudioTracks()[0])
            self.AddStream(connection, screenStream, mPeer, callback)
          },
          function (e){
            console.error('screen sharing with mic error', e)
            self.AddStream(connection, screenStream, mPeer, callback)
        })
      }, function(e){console.error('screen sharing', e)});
      return
    }
    connection.attachStreams = []
    this.AddBaseStream(connection, mediaState, deviceSettings, callback)
  },
  AddBaseStream: function(connection, mediaState, deviceSettings, callback){
    connection.attachStreams.forEach((s) => s.stop());
    connection.attachStreams = []
    var self = this
    if(!mediaState.hasMicrophone && !mediaState.hasWebcam){
      this.CreateFakeStream(connection, connection.multiPeersHandler, callback)
      return
    }
    if(mediaState.hasMicrophone && !mediaState.hasWebcam && connection.dontCaptureUserMedia){
      var audioDevice = deviceSettings.audioInput ? {deviceId: deviceSettings.audioInput} : true
      navigator.getUserMedia(
        { audio: audioDevice, video: false },
        function (stream) {
          self.AddStream(connection, stream, connection.multiPeersHandler, callback)
        },
        function (e) { connection.onMediaError(e) }
      )
      return
    }

    navigator.getUserMedia(connection.mediaConstraints,
      function (stream) {
        self.AddStream(connection, stream, connection.multiPeersHandler, callback)
      },
      function (e) { connection.onMediaError(e) }
    )
  },
  AddStream: function(connection, stream, mPeer, callback){
    connection.attachStreams = []
    connection.addStream(stream)
    mPeer.onGettingLocalMedia(stream)
    this.SetHarkHandler(connection, stream)
    var event = this.CreateVideoElementEvent(connection.userid, stream)
    callback(event)
  },
  CreateFakeStream: function(connection, mPeer, callback){
    connection.attachStreams = []
    var emptyStream = new MediaStream()
    connection.addStream(emptyStream)
    mPeer.onGettingLocalMedia(emptyStream)
    var event = this.CreateVideoElementEvent(connection.userid, emptyStream)
    callback(event)
  },
  CreateVideoElementEvent: function(userid, stream){
    var video = document.createElement("video");
    video.srcObject = stream;
    video.id = stream.id
    video.autoplay=true
    video.playsinline=true
    video.muted=true
    return {
      userid: userid,
      streamid: stream.id,
      mediaElement: video
    }
  },
  SetHarkHandler: function(connection, stream){
    if (!stream || stream.getAudioTracks().length < 1) return;
    if (!connection.onspeaking || !connection.onsilence) {
      return;
    }
    if (typeof hark === 'undefined') {
      throw 'hark.js not found.';
    }

    var speachEvent = {
      userid: connection.userid,
      stream: stream
    }
    var speach = hark(stream, {})

    speach.on('speaking', function() {
      connection.onspeaking(speachEvent)
    });
 
    speach.on('stopped_speaking', function() {
      connection.onsilence(speachEvent);
    });
  }
}

export default RTCUtils
