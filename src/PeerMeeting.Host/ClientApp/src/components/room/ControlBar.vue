<template>
    <div class="room-controls">
    <b-button @click="toggleChat">
      <b-icon :icon="state.chatOpened ? 'chat-left-dots-fill' : 'chat-left-dots'"></b-icon>
      <b-badge
       pill
       variant="info"
       :style="this.$store.state.application.chat.hasNewMessages ? '' : 'visibility:hidden'"
       class="new-messages-badge"
       ></b-badge>
    </b-button>
    <b-button :disabled="!this.state.hasMicrophone" variant="info" @click="toggleAudio"
        ><b-icon :icon="state.audioEnabled ? 'mic' : 'mic-mute'"></b-icon
    ></b-button>
    <b-button variant="danger" @click="leave"
        ><b-icon icon="telephone"></b-icon
    ></b-button>
    <b-button
        :disabled="
        !this.stateService.rtcConnection ||
        this.stateService.rtcConnection.dontCaptureUserMedia ||
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
export default {
  name: "ControlBar",
  props: {
    stateService: Object,
    DetectRTC: Object
  },
  computed:{
    state: function(){
      return this.stateService.state;
    }
  },
  methods: {
    toggleVideo: function () {
      this.stateService.switchVideoMute();
      this.stateService.switchAudioMute(this.state.audioEnabled);// Temporaty patch for enable (if enabled) mic after video disabled
      if(this.state.videoEnabled) this.stateService.renegotiateStreams();
    },
    toggleAudio: function () {
      this.stateService.switchAudioMute();
      if(this.state.audioEnabled) this.stateService.renegotiateStreams();
    },
    toggleChat: function () {
      this.stateService.state.chatOpened = !this.stateService.state.chatOpened;
    },
    shareScreen: function () {
      this.stateService.screenSharing();
    },
    leave: function () {
      this.stateService.leave();
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
.room-controls button {
  margin-right: 0.3em;
}
.new-messages-badge{
  min-height: 15px;
  position: absolute!important;
  top: 0!important;
  display: unset!important;
}
</style>