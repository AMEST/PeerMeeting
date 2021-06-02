<template>
    <div class="room-controls">
    <b-button :disabled="!this.state.hasMicrophone" variant="info" @click="toggleAudio"
        ><b-icon :icon="state.audioEnabled ? 'mic' : 'mic-mute'"></b-icon
    ></b-button>
    <b-button variant="danger" @click="leave"
        ><b-icon icon="telephone"></b-icon
    ></b-button>
    <b-button
        :disabled="
        !this.connection ||
        this.connection.dontCaptureUserMedia ||
        this.state.screenEnabled ||
        !this.state.hasWebcam
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
      if(this.state.videoEnabled) this.connection.renegotiate();
    },
    toggleAudio: function () {
      this.state.audioEnabled = !this.state.audioEnabled;
      RTCUtils.SwitchAudioMute(this.connection, this.state.audioEnabled);
      if(this.state.audioEnabled) this.connection.renegotiate();
    },
    shareScreen: function () {
      this.connection.attachStreams.forEach((s) => s.stop());
      this.state.screenEnabled = !this.state.screenEnabled;
      this.state.audioEnabled = this.state.hasMicrophone;
      this.state.videoEnabled = this.connection.dontCaptureUserMedia && !this.state.hasWebcam
        ? false
        : !this.state.screenEnabled;
      RTCUtils.ScreenSharing(
          this.connection,
          this.state.screenEnabled,
          this.state,
          this.$store.state.application.deviceSettings,
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
  z-index: 100;
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