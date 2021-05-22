<template>
    <div class="room-controls">
    <b-button variant="info" @click="toggleAudio"
        ><b-icon :icon="state.audioEnabled ? 'mic' : 'mic-mute'"></b-icon
    ></b-button>
    <b-button variant="danger" @click="leave"
        ><b-icon icon="telephone"></b-icon
    ></b-button>
    <b-button
        :disabled="
        !this.connection ||
        this.connection.dontCaptureUserMedia ||
        this.state.screenEnabled
        "
        variant="info"
        @click="toggleVideo"
        ><b-icon
        :icon="state.videoEnabled ? 'camera-video' : 'camera-video-off'"
        ></b-icon>
    </b-button>
    <b-button v-if="!this.DetectRTC.isMobileDevice" @click="shareScreen"
        ><b-icon
        :icon="state.screenEnabled ? 'display-fill' : 'display'"
        :style="state.screenEnabled ? 'color: red' : ''"
        ></b-icon
    ></b-button>
    </div>
</template>

<script>
import RTCUtils from "@/RTCUtils";
export default {
  name: "ControlBar",
  props: {
    connection: Object,
    state: Object,
    DetectRTC: Object
  },
  methods: {
    toggleVideo: function () {
      this.state.videoEnabled = !this.state.videoEnabled;
      RTCUtils.SwitchVideoMute(this.connection, this.state.videoEnabled);
      RTCUtils.SwitchAudioMute(this.connection, this.state.audioEnabled); // Temporaty patch for enable (if enabled) mic after video disabled
    },
    toggleAudio: function () {
      this.state.audioEnabled = !this.state.audioEnabled;
      RTCUtils.SwitchAudioMute(this.connection, this.state.audioEnabled);
    },
    shareScreen: function () {
      this.connection.attachStreams.forEach((s) => s.stop());
      this.state.screenEnabled = !this.state.screenEnabled;
      this.state.audioEnabled = true;
      this.state.videoEnabled = this.connection.dontCaptureUserMedia
        ? false
        : !this.state.screenEnabled;
      if (this.connection.dontCaptureUserMedia)
        RTCUtils.ScreenSharingManual(
          this.connection,
          this.state.screenEnabled,
          this.addParticipantBlock
        );
      else
        RTCUtils.ScreenSharing(
          this.connection,
          this.state.screenEnabled,
          this.addParticipantBlock
        );
    },
    leave: function () {
      this.connection.leave();
      window.location.href = "/";
    },
  },
};
</script>

<style>
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