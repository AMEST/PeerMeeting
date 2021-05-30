<template>
  <div class="room">
    <b-container fluid>
      <h3 class="room-name">{{ this.roomId }}</h3>
      <b-card-group
        deck
        id="videos-container"
        class="justify-content-center"
        :class="[
          this.state.halfScreenMode ? 'half-screen-container' : '',
          !this.state.fullScreenMode ? 'card-deck-center' : ''
        ]"
      >
        <participant-block
          v-for="[k, v] in this.participants"
          :key="k"
          :streamEvent="v"
          :state="state"
          :DetectRTC="DetectRTC"
          :participants="participants"
          :class="participants.size <= 2 ? 'only-local-participant' : 'many-participants'"
        ></participant-block>
      </b-card-group>
      <control-bar
        :connection="this.connection"
        :state="this.state"
        :DetectRTC="this.DetectRTC"
      />
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
      fullScreenMode: false,
      hasWebcam: true,
      hasMicrophone: true,
    },
    participants: new Map(),
    DetectRTC: require("detectrtc"),
  }),
  components: {
    RTCMultiConnection,
    ParticipantBlock,
    ControlBar,
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

      var username = CommonUtils.getUserNameFromEvent(event);
      this.$bvToast.toast("User " + username + " left", {
        title: `Room notification`,
        variant: "info",
        solid: true,
      });
    },
    userStatusChanged: function (event) {
      if (this.participants.has(event.userid) || event.status === "offline")
        return;
      var username = CommonUtils.getUserNameFromEvent(event);
      this.$bvToast.toast("User " + username + " joined", {
        title: `Room notification`,
        variant: "info",
        solid: true,
      });
      this.addParticipantBlock({
        userid: event.userid,
        mediaElement: document.createElement("div"),
        streamid: null,
      });
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

      this.connection.extra = {
        profile: this.$store.state.application.profile,
      };
      // using signalR for signaling
      this.connection.setCustomSocketHandler(WebRtcSignalR);
      // Configure base callbacks
      RTCUtils.ConfigureBase(
        this.connection, 
        this.participants,
        this.$store.state.application.deviceSettings,
        this.streamEnded);
      this.connection.onstream = this.addParticipantBlock;
      this.connection.onUserStatusChanged = this.userStatusChanged;
      // Configure media error
      RTCUtils.ConfigureMediaError(
        this.connection,
        DetectRTC,
        this.$store.state.application.deviceSettings,
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
};
</script>
<style>
.card-deck{
  max-height: calc(100vh - 110px);
}
.full-height {
  min-height: calc(100vh - 63px);
  max-height: calc(100vh - 63px);
}
.fork-me {
  display: none;
}
@media (max-width: 380px) {
  .container-fluid {
    padding-left: 0px !important;
    padding-right: 0px !important;
  }
}
.half-screen-container {
  position: absolute;
  right: 1.5em;
  width: 249px !important;
  max-height: calc(100% - 152px);
  overflow-y: scroll;
  top: unset !important; 
  -webkit-transform: inherit!important;
  transform: inherit!important;
}
.half-screen-container .user-block {
  min-width: 215px !important;
  min-height: 160px !important;
  margin-top: 5px;
}
.half-screen-container .only-local-participant{
  height: inherit!important;
}
.half-screen-container .many-participants{
  height: inherit!important;
}
.only-local-participant {
  height: 100vw;
}
.many-participants {
  height: 20vw !important;
  max-height: 20vw !important;
}
@media (min-width: 578px) {
  .many-participants {
    max-width: 35vw;
  }
}
@media (min-width: 770px) {
  .card-deck-center {
    position: absolute;
    width: 100%;
    top: 25%;
    -ms-transform: translateY(-15%);
    transform: translateY(-15%);
  }
}
</style>