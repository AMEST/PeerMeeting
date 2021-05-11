<template>
  <div class="room">
    <b-container fluid>
      <h1>room: {{this.roomId}}</h1>
      <br />
      <div id="videos-container"></div>
    </b-container>
  </div>
</template>

<script>
 /* eslint-disable */
// @ is an alias to /src
import WebRtcSignalR from '@/WebRtcHub';
import RTCMultiConnection from 'rtcmulticonnection';
require('adapterjs');
export default {
  name: "room",
  data: () => ({
    roomId: "",
    connection: null,
  }),
  components: {
    RTCMultiConnection 
  },
  methods: {
    initialize: function () {
      var DetectRTC = require('detectrtc');
      this.connection = new RTCMultiConnection();
      console.info('rtc', this.connection)
      
      // using signalR for signaling
      this.connection.setCustomSocketHandler(WebRtcSignalR)
      this.connection.session = {
        audio: true,
        video: true,
      };
      this.connection.sdpConstraints.mandatory = {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true,
      };

      this.connection.onstream = function (event) {
        var existing = document.getElementById(event.streamid);
        if (existing && existing.parentNode) {
          existing.parentNode.removeChild(existing)
        }

        document
          .getElementById("videos-container")
          .appendChild(event.mediaElement)
      };

      this.connection.onstreamended = function (event) {
        var mediaElement = document.getElementById(event.streamid)
        if (mediaElement) {
          mediaElement.parentNode.removeChild(mediaElement)
        }
      };

      this.connection.onMediaError = function (e) {
        if (e.message === "Concurrent mic process limit.") {
          if (DetectRTC.audioInputDevices.length <= 1) {
            alert(
              "Please select external microphone. Check github issue number 483."
            );
            return;
          }

          var secondaryMic = DetectRTC.audioInputDevices[1].deviceId
          this.connection.mediaConstraints.audio = {
            deviceId: secondaryMic,
          };

          this.connection.join(this.connection.sessionid)
        }
      };

    },
    join: function(){
      this.connection.join(this.roomId)
    }
  },
  created: function () {
    this.roomId = this.$route.params.id
    this.initialize()
    this.join(this.roomId)
  },
  watch: {
    // eslint-disable-next-line
    $route(to, from) {
      this.roomId = to
      this.initialize()
      this.join(this.roomId)
    },
  },
  destroyed: function () {
  },
};
</script>
<style>
.right-border {
  border-right: 1px solid #e8e8e8;
}
.top-border {
  border-top: 1px solid #e8e8e8;
}
.full-height {
  min-height: calc(100vh - 63px);
}
.block-min-height {
  min-height: 600px;
}
</style>