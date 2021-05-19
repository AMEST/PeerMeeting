/* eslint-disable */
var RTCUtils = {
  ConfigureBase: function (connection, participants,  streamEndedCallback = (event) =>{}) {
    connection.codecs.video = 'VP8'
    connection.session = {
      audio: true,
      video: true
    }
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
        if(connectedParticipants.indexOf(key) == -1 && connection.userid != key)
          participants.delete(key)
      }
    }, 5000)

    // overriding the event to replace the poster XD
    connection.onmute = function(e) {
      if (!e || !e.mediaElement) {
          return;
      }

      if (e.muteType === 'both' || e.muteType === 'video') {
          e.mediaElement.hidden = true;
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
        e.mediaElement.muted = true;
      if(e.mediaElement.tagName == "VIDEO" && e.unmuteType == 'video')
        e.mediaElement.hidden = false
    }

  },
  // Configure media error event for try use another microfon or if webcam not available, connect without it
  // eslint-disable-next-line
  ConfigureMediaError: function (connection, DetectRTC, callback = (videoState, audioState) => { }) {
    connection.onMediaError = function (e) {
      console.error('Media Error', e)
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
        connection.join(connection.sessionid)
        return
      }else{
        var mPeer = connection.multiPeersHandler
        callback(false, true)
        connection.dontCaptureUserMedia = true
        navigator.getUserMedia =
                    navigator.getUserMedia ||
                    navigator.webkitGetUserMedia ||
                    navigator.mozGetUserMedia
        navigator.getUserMedia(
          { audio: true, video: false },
          function (stream) {
            connection.addStream(stream)
            mPeer.onGettingLocalMedia(stream)
            connection.join(connection.sessionid)
          },
          function () { }
        )
      }
    }
  },
  // Switch mute/unmute audio
  SwitchAudioMute: function(connection, state){
    connection.attachStreams.forEach( s =>{
      if(state)
        s.unmute("audio")
      else
        s.mute("audio")
    })
  },
  // Switch mute/unmute video
  SwitchVideoMute: function(connection, state){
    connection.attachStreams.forEach( s =>{
      if(state)
        s.unmute("video")
      else
        s.mute("video")
    })
  },
  // Start screen sharing or stop and back to video + audio
  ScreenSharing: function(connection, state, callback){
    connection.attachStreams.forEach(s => s.stop())
    console.log(connection.attachStreams)
    var mPeer = connection.multiPeersHandler
    var self = this
    setTimeout(()=>{
      if(state){
        navigator.mediaDevices.getDisplayMedia({video: true, audio: true})
        .then(function(stream){
          connection.attachStreams = []
          connection.addStream(stream)
          mPeer.onGettingLocalMedia(stream)
          var event = self.CreateVideoElementEvent(connection.userid, stream)
          callback(event)
        }, function(e){console.error('screen sharing', e)});
      }else{
        connection.attachStreams = []
        connection.addStream({
          audio: true,
          video: true,
          oneway: true,
          streamCallback: function(stream){
            mPeer.onGettingLocalMedia(stream)
          }
        })
      }
    }, 500);  
  },
  // Start screen sharing or stop and back to  only audio mode
  ScreenSharingManual: function(connection, state, callback){
    connection.attachStreams.forEach(s => s.stop())
    var mPeer = connection.multiPeersHandler
    var self = this
    if(state){
      navigator.mediaDevices.getDisplayMedia({video: true, audio: true})
      .then(function(stream){
        connection.attachStreams = []
        connection.addStream(stream);
        mPeer.onGettingLocalMedia(stream)
        var event = self.CreateVideoElementEvent(connection.userid, stream)
        callback(event)
      }, function(e){console.error('screen sharing', e)});
    }else{
      navigator.getUserMedia(
        { audio: true, video: false },
        function (stream) {
          connection.attachStreams = []
          connection.addStream(stream)
          mPeer.onGettingLocalMedia(stream)
          var event = self.CreateVideoElementEvent(connection.userid, stream)
          callback(event)
        },
        function () { }
      )
    }
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
  }
}

export default RTCUtils
