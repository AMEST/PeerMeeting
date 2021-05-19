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
    connection.onstreamended = function (event) {
      console.log('stream ended', event)
      streamEndedCallback(event)
      var mediaElement = document.getElementById(event.streamid)
      if (mediaElement) {
        mediaElement.parentNode.removeChild(mediaElement)
      }
    }
    setInterval(() =>{
      var connectedParticipants = connection.getAllParticipants()
      for(const key of participants.keys()){
        if(connectedParticipants.indexOf(key) == -1 && connection.userid != key)
          participants.delete(key)
      }
    }, 5000)
    connection.onmute = function(e) {
      if (!e || !e.mediaElement) {
          return;
      }

      if (e.muteType === 'both' || e.muteType === 'video') {
          e.mediaElement.src = null;
          var paused = e.mediaElement.pause();
          if (typeof paused !== 'undefined') {
              paused.then(function() {
                  e.mediaElement.poster = e.snapshot || '/img/transparent-muted.png';
              });
          } else {
              e.mediaElement.poster = e.snapshot || '/img/transparent-muted.png';
          }
      } else if (e.muteType === 'audio') {
          e.mediaElement.muted = true;
      }
    };
  },
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
            console.log('STREAM', stream)
            connection.join(connection.sessionid)
          },
          function () { }
        )
      }
    }
  },
  SwitchAudioMuteManualStream: function(connection, state){
    connection.attachStreams.forEach( s =>{
      s.getTracks().forEach( t =>{
        if(t.kind == 'audio'){
          t.enabled = state
          connection.StreamsHandler.onSyncNeeded(
            s.id,
            state? "unmute" : "mute",
            "audio"
          )
        }
      })
    })
  },
  SwitchVideoMuteManualStream: function(connection, state){
    connection.attachStreams.forEach( s =>{
      s.getTracks().forEach( t =>{
        if(t.kind == 'video'){
          t.enabled = state
          connection.StreamsHandler.onSyncNeeded(
            s.id,
            state? "unmute" : "mute",
            "video"
          )
        }
      })
    })
  },
  ScreenSharing: function(connection, state, callback){
    connection.attachStreams.forEach(s => s.stop())
    console.log(connection.attachStreams)
    var self = this
    setTimeout(()=>{
      if(state){
        navigator.mediaDevices.getDisplayMedia({video: true, audio: true})
        .then(function(stream){
          connection.attachStreams = []
          connection.addStream(stream);
          var event = self.CreateVideoElementEvent(connection.userid, stream)
          callback(event)
        }, function(e){console.error('screen sharing', e)});
      }else{
        connection.attachStreams = []
        connection.addStream({
          audio: true,
          video: true,
          oneway: true
        })
      }
    }, 500);  
  },
  ScreenSharingManual: function(connection, state, callback){
    connection.attachStreams.forEach(s => s.stop())
    var self = this
    if(state){
      navigator.mediaDevices.getDisplayMedia({video: true, audio: true})
      .then(function(stream){
        connection.attachStreams = []
        connection.addStream(stream);
        var event = self.CreateVideoElementEvent(connection.userid, stream)
        callback(event)
      }, function(e){console.error('screen sharing', e)});
    }else{
      navigator.getUserMedia(
        { audio: true, video: false },
        function (stream) {
          connection.attachStreams = []
          connection.addStream(stream)
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
