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
          !this.state.fullScreenMode ? 'card-deck-center' : '',
        ]"
      >
        <participant-block
          v-for="[k, v] in this.participants"
          :key="k"
          :streamEvent="v"
          :state="state"
          :DetectRTC="DetectRTC"
          :participants="participants"
          :connection="connection"
          :class="
            participants.size <= 2
              ? 'only-local-participant'
              : 'many-participants'
          "
        ></participant-block>
      </b-card-group>
      <chat
        :style="this.state.chatOpened ? '' : 'visibility:hidden'"
        :roomId="this.connection.channel"
        :state="this.state"
      />
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
import ParticipantBlock from "@/components/room/participant/ParticipantBlock.vue";
import Chat from "@/components/room/Chat.vue";
import ControlBar from "@/components/room/ControlBar.vue";
require("adapterjs");
export default {
  name: "room",
  data: () => ({
    roomId: "",
    connection: null,
    state: {
      chatOpened: false,
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
    Chat,
  },
  methods: {
    addParticipantBlock: function (event) {
      if (this.participants.has(event.userid) && event.cardfix) return;
      if (this.participants.has(event.userid))
        this.participants.delete(event.userid);
      event.extra = CommonUtils.extractExtraData(this.connection, event.userid);
      this.participants.set(event.userid, event);
      this.$forceUpdate();
      if(this.connection.userid == event.userid
        && event.type == "local")
        RTCUtils.SetHarkHandler(this.connection, event.stream)
    },
    streamEnded: function (event) {
      if (!this.participants.has(event.userid)) return;
      this.participants.delete(event.userid);
      this.$forceUpdate();

      var peer = this.connection.peers[event.userid];
      if (
        this.connection.userid === event.userid ||
        (peer &&
          peer.peer &&
          peer.peer.connectionState &&
          peer.peer.connectionState === "connected")
      )
        return;

      var username = CommonUtils.getUserNameFromEvent(event);
      this.$bvToast.toast("User " + username + " left", {
        title: `Room notification`,
        variant: "info",
        solid: true,
      });
    },
    userStatusChanged: function (event) {
      if (
        this.participants.has(event.userid) &&
        event.status === "online" &&
        event.extra
      ) {
        var participant = this.participants.get(event.userid);
        participant.extra = event.extra;
        if (participant.changeCallback) participant.changeCallback();
        return;
      }
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
        cardfix: true,
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
        audioMuted: false,
        videoMuted: false,
        speacking: false
      };
      // using signalR for signaling
      this.connection.setCustomSocketHandler(WebRtcSignalR);
      // Configure base callbacks
      RTCUtils.ConfigureBase(
        this.connection,
        this.participants,
        this.$store.state.application.deviceSettings,
        this.streamEnded
      );
      this.connection.onstream = this.addParticipantBlock;
      this.connection.onUserStatusChanged = this.userStatusChanged;
      this.connection.onMuteForcibly = function () {
        self.state.audioEnabled = false;
      };
      // Configure media error
      this.configureMediaError();
    },
    configureMediaError: function () {
      RTCUtils.ConfigureMediaError(
        this.connection,
        DetectRTC,
        this.$store.state.application.deviceSettings,
        this.mediaErrorCallback
      );
    },
    mediaErrorCallback: function (videoState, audioState) {
      this.state.videoEnabled = videoState;
      this.state.audioEnabled = audioState;
      this.state.hasWebcam = videoState;
      this.state.hasMicrophone = audioState;
      this.connection.extra.audioMuted = !audioState;
      this.connection.extra.videoMuted = !videoState;
      this.addParticipantBlock({
        streamid: null,
        userid: this.connection.userid,
        mediaElement: document.createElement("div"),
      });
    },
    addToHistory: function () {
      CommonUtils.addToHistory(this.$store, {
        id: this.roomId,
        date: new Date(),
      });
    },
    inputDeviceChanged: function () {
      this.configureMediaError();
      RTCUtils.ConfigureMediaConstraints(
        this.connection,
        this.$store.state.application.deviceSettings
      );
      this.connection.dontCaptureUserMedia = false;
      this.state.hasWebcam = true;
      this.state.hasMicrophone = true;

      if (this.state.screenEnabled) return;

      this.state.audioEnabled = true;
      this.state.videoEnabled = true;
      RTCUtils.AddBaseStream(
        this.connection,
        this.state,
        this.$store.state.application.deviceSettings,
        this.addParticipantBlock
      );
    },
  },
  created: function () {
    this.roomId = this.$route.params.id;
    this.addToHistory();
    this.initialize();
    this.connection.join(this.roomId);
    this.$store.commit("addDeviceChangedCallback", this.inputDeviceChanged);
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
#app {
  height: calc(100vh - 48px) !important;
}
.card-deck {
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
  -webkit-transform: inherit !important;
  transform: inherit !important;
}
.half-screen-container .user-block {
  min-width: 215px !important;
  min-height: 160px !important;
  margin-top: 5px;
}
.half-screen-container .only-local-participant {
  height: inherit !important;
}
.half-screen-container .many-participants {
  height: inherit !important;
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