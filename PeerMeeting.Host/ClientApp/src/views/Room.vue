<template>
  <div class="room">
    <b-container fluid>
      <h3 class="room-name">{{ this.roomId }}</h3>
      <b-card-group deck id="videos-container">
        <participant-block
          v-for="[k, v] in this.participants"
          :key="k"
          :streamEvent="v"
        ></participant-block>
      </b-card-group>
      <div class="room-controls">
        <b-button variant="info" @click="toggleAudio"
          ><b-icon :icon="audioEnabled ? 'mic' : 'mic-mute'"></b-icon
        ></b-button>
        <b-button variant="danger" @click="leave"
          ><b-icon icon="telephone"></b-icon
        ></b-button>
        <b-button
          :disabled="!this.connection || this.connection.dontCaptureUserMedia"
          variant="info"
          @click="toggleVideo"
          ><b-icon
            :icon="videoEnabled ? 'camera-video' : 'camera-video-off'"
          ></b-icon
        ></b-button>
        <b-button @click="shareScreen">screen</b-button>
      </div>
    </b-container>
  </div>
</template>

<script>
/* eslint-disable */
// @ is an alias to /src
import WebRtcSignalR from "@/WebRtcHub";
import RTCUtils from "@/RTCUtils";
import RTCMultiConnection from "rtcmulticonnection";
import { v4 as uuidv4 } from "uuid";
import ParticipantBlock from "@/components/ParticipantBlock.vue";
require("adapterjs");
export default {
  name: "room",
  data: () => ({
    roomId: "",
    connection: null,
    audioEnabled: true,
    videoEnabled: true,
    screenEnabled: false,
    participants: new Map(),
  }),
  components: {
    RTCMultiConnection,
    ParticipantBlock,
  },
  methods: {
    toggleVideo: function () {
      this.videoEnabled = !this.videoEnabled;
      if(!this.videoEnabled) this.connection.attachStreams[0].mute("video");
      else this.connection.attachStreams[0].unmute("video");
    },
    toggleAudio: function () {
      this.audioEnabled = ! this.audioEnabled;
      if(!this.dontCaptureUserMedia){
        if(!this.audioEnabled) this.connection.attachStreams[0].mute("audio");
        else this.connection.attachStreams[0].unmute("audio");
        return
      }
      if(!this.audioEnabled){
        this.connection.attachStreams[0].getTracks()[0].enabled = this.audioEnabled;
        this.connection.StreamsHandler.onSyncNeeded(this.connection.attachStreams[0].id, 'mute', 'both');
      }else{
        this.connection.attachStreams[0].getTracks()[0].enabled = this.audioEnabled;
        this.connection.StreamsHandler.onSyncNeeded(this.connection.attachStreams[0].id, 'unmute', 'both');
      }
    },
    shareScreen: function(){
      console.log('share', this.screenEnabled)
      this.connection.attachStreams.forEach(s => s.stop())
      this.screenEnabled = !this.screenEnabled;
      if (this.connection.dontCaptureUserMedia) RTCUtils.ScreenSharingManual(this.connection, this.screenEnabled, this.participants);
      else RTCUtils.ScreenSharing(this.connection, this.screenEnabled);
    },
    addParticipantBlock: function (event) {
      if (this.participants.has(event.userid))
        this.participants.delete(event.userid);

      this.participants.set(event.userid, event);
      this.$forceUpdate();
    },
    streamEnded: function (event) {
      if (!this.participants.has(event.userid)) return;
      this.participants.delete(event.userid);
      this.$forceUpdate();
    },
    join: function () {
      this.connection.join(this.roomId);
    },
    leave: function () {
      this.connection.leave();
      window.location.href = "/";
    },
    initialize: function () {
      var self = this;
      var DetectRTC = require("detectrtc");
      try {
        this.connection = new RTCMultiConnection();
      } catch (e) {
        console.error("Error Initialize RTCMultuConnection", e);
        window.location.reload();
      }
      this.connection.userid =
        uuidv4() + "|" + this.$store.state.application.profile.name;
      // using signalR for signaling
      this.connection.setCustomSocketHandler(WebRtcSignalR);
      RTCUtils.ConfigureBase(this.connection, this.streamEnded);

      this.connection.onstream = function (event) {
        // eslint-disable-next-line
        console.log("onStream", event);
        self.addParticipantBlock(event);
      };
      RTCUtils.ConfigureMediaError(
        this.connection,
        DetectRTC,
        (videoState, audioState) => {
          self.videoEnabled = videoState;
          self.audioEnabled = audioState;
          self.addParticipantBlock({
            streamid: null,
            userid: self.connection.userid,
            mediaElement: document.createElement("div"),
          });
        }
      );
    },
    addToHistory: function () {
      var room = {
        id: this.roomId,
        date: new Date(),
      };
      var existRoom = this.$store.state.application.roomHistory.find(
        (e, i, a) => e.id == room.id
      );
      if (existRoom) {
        this.$store.commit("updateRoomHistory", room);
        return;
      }
      this.$store.commit("addRoomToHistory", room);
    },
  },
  created: function () {
    this.roomId = this.$route.params.id;
    this.addToHistory();
    this.initialize();
    this.join(this.roomId);
  },
  watch: {
    // eslint-disable-next-line
    $route(to, from) {
      this.roomId = to;
      this.connection.leave();
      this.addToHistory();
      this.initialize();
      this.join(this.roomId);
    },
  },
  destroyed: function () {},
};
</script>
<style>

.full-height {
  min-height: calc(100vh - 63px);
  max-height: calc(100vh - 63px);
}
.room-controls {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 48px;
  background-color: rgb(0, 0, 0, 0.2);
  vertical-align: middle;
  line-height: 48px;
  z-index: 30;
}
.room-name {
  padding-top: 5px;
  color: rgb(0, 0, 0, 0.4);
  font-weight: bold;
}
.room-controls button {
  margin-right: 0.3em;
}
</style>