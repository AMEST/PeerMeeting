// Copyright 2021 Klabukov Erik.
// SPDX-License-Identifier: GPL-3.0-only

/* eslint-disable */
var RTCUtils = {
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
