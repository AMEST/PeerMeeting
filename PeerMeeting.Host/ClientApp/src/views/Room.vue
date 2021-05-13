<template>
  <div class="room">
    <b-container fluid>
      <h1>room: {{ this.roomId }}</h1>
      <br />
      <b-button @click="toggleAudio">{{
        audioEnabled ? "Mute" : "Unmute"
      }}</b-button>
      <b-button @click="toggleVideo">{{
        videoEnabled ? "Disable video" : "Video"
      }}</b-button>
      <div id="videos-container"></div>
      <b-card v-for="p in participants" :key="p.id" ref="p"></b-card>
    </b-container>
  </div>
</template>

<script>
/* eslint-disable */
// @ is an alias to /src
import WebRtcSignalR from "@/WebRtcHub";
import RTCMultiConnection from "rtcmulticonnection";
import { v4 as uuidv4 } from 'uuid'
require("adapterjs");
export default {
  name: "room",
  data: () => ({
    roomId: "",
    connection: null,
    audioEnabled: true,
    videoEnabled: true,
    participants:[]
  }),
  components: {
    RTCMultiConnection,
  },
  methods: {
    toggleVideo: function () {
      if (this.videoEnabled) this.connection.attachStreams[0].mute("video");
      else this.connection.attachStreams[0].unmute("video");
    },
    toggleAudio: function () {
      if (this.audioEnabled) this.connection.attachStreams[0].mute("audio");
      else this.connection.attachStreams[0].unmute("audio");
    },
    addParticipantBlock: function(id, innerBlock){
      console.log(id, innerBlock)
      this.participants.push({
        id: "card-"+id,
        object: innerBlock
      })
    },
    join: function () {
      this.connection.join(this.roomId);
    },
    initialize: function () {
      var self = this;
      var DetectRTC = require("detectrtc");
      this.connection = new RTCMultiConnection();
      console.info("rtc", this.connection);

      // using signalR for signaling
      this.connection.setCustomSocketHandler(WebRtcSignalR);
      console.info("rtc", "1");
      this.connection.session = {
        audio: true,
        video: true,
      };
      console.info("rtc", "2");
      this.connection.sdpConstraints.mandatory = {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true,
      };
      console.info("rtc", "3");
      this.connection.onstream = function (event) {
        console.log('onStream', event)
        var existing = document.getElementById(event.streamid);
        if (existing && existing.parentNode) {
          existing.parentNode.removeChild(existing);
        }

        //document
        //  .getElementById("videos-container")
        //  .appendChild(event.mediaElement);
        self.addParticipantBlock(event.streamid, event.mediaElement)
        setTimeout(() => {
          var stream = document.getElementById(event.streamid);
          stream.play();
        }, 1000);
      };

      this.connection.onstreamended = function (event) {
        var mediaElement = document.getElementById(event.streamid);
        if (mediaElement) {
          mediaElement.parentNode.removeChild(mediaElement);
        }
        var participantBlock = document.getElementById('card-'+event.streamid);
        if (participantBlock) {
          participantBlock.parentNode.removeChild(participantBlock);
        }
      };
      this.connection.onMediaError = function (e) {
        console.error("Media Error", e);
        if (e.message === "Concurrent mic process limit.") {
          if (DetectRTC.audioInputDevices.length <= 1) {
            alert(
              "Please select external microphone. Check github issue number 483."
            );
            return;
          }

          var secondaryMic = DetectRTC.audioInputDevices[1].deviceId;
          self.connection.mediaConstraints.audio = {
            deviceId: secondaryMic,
          };

          self.connection.join(self.connection.sessionid);
          return;
        }
        if (e.message === "Could not start video source") {
          self.videoEnabled = false;
          self.audioEnabled = true;
          self.connection.dontCaptureUserMedia = true;
          navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
          navigator.getUserMedia({audio: true, video: false}, function (stream) {
            self.connection.addStream(stream);
            console.log('STREAM', stream)
            self.connection.join(self.connection.sessionid);
          }, function(){})
          
          return;
        }
      };
    }
  },
  created: function () {
    this.roomId = this.$route.params.id;
    console.info("created", "run init");
    this.initialize();
    console.info("created", "run join");
    this.join(this.roomId);
  },
  watch: {
    // eslint-disable-next-line
    $route(to, from) {
      this.roomId = to;
      this.initialize();
      this.join(this.roomId);
    },
  },
  destroyed: function () {},
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