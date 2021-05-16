<template>
  <div class="room">
    <b-container fluid>
      <h3 class="room-name">{{ this.roomId }}</h3>
      <div id="videos-container" class="card-deck"></div>
      <div class="room-controls">
        <b-button variant="info" @click="toggleAudio"
          ><b-icon :icon="audioEnabled ? 'mic' : 'mic-mute'"></b-icon
        ></b-button>
        <b-button variant="danger" @click="leave"
          ><b-icon icon="telephone"></b-icon
        ></b-button>
        <b-button :disabled="!this.connection || this.connection.dontCaptureUserMedia" variant="info" @click="toggleVideo"
          ><b-icon
            :icon="videoEnabled ? 'camera-video' : 'camera-video-off'"
          ></b-icon
        ></b-button>
      </div>
    </b-container>
  </div>
</template>

<script>
/* eslint-disable */
// @ is an alias to /src
import WebRtcSignalR from "@/WebRtcHub";
import RtcConfigurationUtils from "@/RTCUtils";
import RTCMultiConnection from "rtcmulticonnection";
import { v4 as uuidv4 } from "uuid";
require("adapterjs");
export default {
  name: "room",
  data: () => ({
    roomId: "",
    connection: null,
    audioEnabled: true,
    videoEnabled: true,
    participants: [],
  }),
  components: {
    RTCMultiConnection,
  },
  methods: {
    toggleVideo: function () {
      if (this.videoEnabled) {
        this.connection.attachStreams[0].mute("video");
        this.videoEnabled = false;
      } else {
        this.connection.attachStreams[0].unmute("video");
        this.videoEnabled = true;
      }
    },
    toggleAudio: function () {
      if (this.audioEnabled) {
        this.connection.attachStreams[0].mute("audio");
        this.audioEnabled = false;
      } else {
        this.connection.attachStreams[0].unmute("audio");
        this.audioEnabled = true;
      }
    },
    addParticipantBlock: function (event) {
      var userBlock = document.getElementById(event.userid);
      if (!existing) {
        userBlock = document.createElement("div");
        userBlock.id = event.userid;
        userBlock.setAttribute(
          "class",
          "card bg-secondary text-white user-block"
        );
        var username = document.createElement("span");
        username.innerText = event.userid.split("|")[1];
        username.setAttribute("class", "username-span");
        userBlock.appendChild(username);
        document.getElementById("videos-container").appendChild(userBlock);
      }

      var existing = document.getElementById(event.streamid);
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
      if (event.mediaElement != null) event.mediaElement.controls = false;
      userBlock.appendChild(event.mediaElement);
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
      RtcConfigurationUtils.ConfigureBase(this.connection);

      this.connection.onstream = function (event) {
        // eslint-disable-next-line
        console.log("onStream", event);
        self.addParticipantBlock(event);
        setTimeout(() => {
          var stream = document.getElementById(event.streamid);
          stream.play();
        }, 1000);
      };
      RtcConfigurationUtils.ConfigureMediaError(
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
    addToHistory: function() {
      var room = {
        id : this.roomId,
        date: new Date()
      }
      var existRoom = this.$store.state.application.roomHistory.find((e, i, a)=> e.id == room.id);
      if(existRoom){
        this.$store.commit('updateRoomHistory', room);
        return;
      }
      this.$store.commit('addRoomToHistory', room);
    }
  },
  created: function () {
    this.roomId = this.$route.params.id;
    this.addToHistory();
    // eslint-disable-next-line
    console.info("created", "run init");
    this.initialize();
    // eslint-disable-next-line
    console.info("created", "run join");
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
.right-border {
  border-right: 1px solid #e8e8e8;
}
.top-border {
  border-top: 1px solid #e8e8e8;
}
.full-height {
  min-height: calc(100vh - 63px);
  max-height: calc(100vh - 63px);
}
.block-min-height {
  min-height: 600px;
}

.user-block {
  min-width: 355px;
  overflow: hidden;
  border-radius: 18px;
  max-height: calc(100vh - 169px);
  height: fit-content;
  min-height: 240px;
}
.user-block video {
  background-color: black;
}
.username-span {
  position: absolute;
  background-color: rgb(255, 255, 255, 0.32);
  width: 100%;
  overflow: hidden;
  overflow-wrap: normal;
  color: black;
  font-weight: bold;
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
}
.room-name{
  padding-top: 5px;
  color: rgb(0, 0, 0, 0.4);
  font-weight: bold;
}
.room-controls button {
  margin-right: 0.3em;
}
</style>