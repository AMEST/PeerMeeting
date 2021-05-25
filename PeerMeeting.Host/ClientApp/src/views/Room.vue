<template>
  <div class="room">
    <b-container fluid>
      <h3 class="room-name">{{ this.roomId }}</h3>
      <b-card-group deck id="videos-container" :class="this.state.halfScreenMode? 'half-screen-container':''">
        <participant-block
          v-for="[k, v] in this.participants"
          :key="k"
          :streamEvent="v"
          :state="state"
          :DetectRTC="DetectRTC"
          :participants="participants"
        ></participant-block>
      </b-card-group>
      <control-bar :connection="this.connection" :state="this.state" :DetectRTC="this.DetectRTC"/>
    </b-container>
  </div>
</template>

<script>
/* eslint-disable */
// @ is an alias to /src
import WebRtcSignalR from "@/WebRtcHub";
import RTCUtils from "@/RTCUtils";
import RTCMultiConnection from "rtcmulticonnection";
import CommonUtils from "@/CommonUtils";
import { v4 as uuidv4 } from "uuid";
import ParticipantBlock from "@/components/ParticipantBlock.vue";
import ControlBar from "@/components/ControlBar.vue";
require("adapterjs");
export default {
  name: "room",
  data: () => ({
    roomId: "",
    connection: null,
    state: {
      audioEnabled: true,
      videoEnabled: true,
      screenEnabled: false,
      halfScreenMode: false,
      hasWebcam: true,
      hasMicrophone: true
    },
    participants: new Map(),
    DetectRTC: require("detectrtc"),
  }),
  components: {
    RTCMultiConnection,
    ParticipantBlock,
    ControlBar
  },
  methods: {
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
    initialize: function () {
      var self = this;
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
      RTCUtils.ConfigureBase(
        this.connection,
        this.participants,
        this.streamEnded
      );
      this.connection.onstream = this.addParticipantBlock;
      this.connection.onUserStatusChanged = function(event) {
        if(self.participants.has(event.userid)) return;
        self.addParticipantBlock({
          userid: event.userid,
          mediaElement: document.createElement('div'),
          streamid: null
        })
      };
      RTCUtils.ConfigureMediaError(
        this.connection,
        DetectRTC,
        (videoState, audioState) => {
          self.state.videoEnabled = videoState;
          self.state.audioEnabled = audioState;
          self.state.hasWebcam = videoState;
          self.state.hasMicrophone = audioState;
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
      CommonUtils.addToHistory(this.$store, room);
    },
  },
  created: function () {
    this.roomId = this.$route.params.id;
    this.addToHistory();
    this.initialize();
    this.connection.join(this.roomId);
  },
  watch: {
    // eslint-disable-next-line
    $route(to, from) {
      this.roomId = to;
      this.connection.leave();
      this.addToHistory();
      this.initialize();
      this.connection.join(this.roomId);
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
.fork-me {
  display: none;
}
@media (max-width: 380px) { 
  .container-fluid{
    padding-left: 0px!important;
    padding-right: 0px!important;
  }
}
.half-screen-container{
  position: absolute;
  right: 1.5em;
  width: 249px!important;
  max-height: calc( 100% - 152px );
  overflow-y: scroll;
}
.half-screen-container .user-block{
  min-width: 215px!important;
  min-height: 160px!important;
  margin-top: 5px;
}
</style>