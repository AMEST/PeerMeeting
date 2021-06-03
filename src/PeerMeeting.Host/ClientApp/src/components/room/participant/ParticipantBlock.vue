<template>
  <div
    class="card text-white user-block"
    :class="[
      this.fullscreen ? 'pseudo-fullscreen' : '',
      this.halfscreen ? 'half-screen' : '',
    ]"
    :style="
      this.halfscreen
        ? 'max-height: unset!important;height: 80%!important; max-width: unset;'
        : ''
    "
    :id="'card-' + this.streamEvent.userid"
  >
    <span class="username-span">{{ this.profile.username }}</span>
    <b-avatar
      :class="[
        this.state.halfScreenMode && !this.halfscreen ? 'b-avatar-half' : '',
        this.profile.avatar ? 'has-avatar' : '',
      ]"
      :src="this.profile.avatar"
      :text="this.getInitials()"
    ></b-avatar>

    <b-button
      class="fullscreen-button"
      size="sm"
      variant="outline-secondary"
      @click="switchFullscreen"
      :disabled="this.state.halfScreenMode"
    >
      <b-icon v-if="!this.fullscreen" icon="fullscreen" />
      <b-icon v-else icon="fullscreen-exit" />
    </b-button>

    <b-button
      v-if="this.streamEvent.type != 'local'"
      class="connection-info"
      variant="outline-light"
      size="sm"
      @click="$bvToast.show('toast-' + streamEvent.userid)"
    >
      <b-icon icon="bar-chart-fill" />
    </b-button>
    <connection-info :userId="this.streamEvent.userid" :stats="this.stats"/>
    <b-icon
      class="audio-muted-icon"
      :icon="this.streamEvent.extra.audioMuted ? 'mic-mute' : 'mic'"
      :style="this.streamEvent.extra.audioMuted ? 'color: red' : ''"
    ></b-icon>
    <b-icon
      class="video-muted-icon"
      :icon="
        this.streamEvent.extra.videoMuted ? 'camera-video-off' : 'camera-video'
      "
      :style="this.streamEvent.extra.videoMuted ? 'color: red' : ''"
    ></b-icon>

    <div class="switch-half-screen" @click="switchHalfScreen"></div>
  </div>
</template>

<script>
import CommonUtils from "@/CommonUtils";
import PeerStats from "@/services/PeerStats";
import ConnectionInfo from "@/components/room/participant/ConnectionInfo";
export default {
  name: "ParticipantBlock",
  components:{
    ConnectionInfo
  },
  data: () => {
    return {
      fullscreen: false,
      halfscreen: false,
      halfscreenTimer: null,
      streamValidateTimer: null,
      profile: {
        username: null,
        avatar: null,
      },
      stats: {
        bandwidth: 0,
        stunOrTurn: { local: "", remote: "" },
        ips: { local: "", remote: "" },
        transport: { local: "", remote: "" },
        data: { send: 0, receive: 0 },
        packets: { send: 0, receive: 0 },
        codecs: { local: "", remote: "" },
        connectionState: "",
        rtt: 0.0,
      },
      peerStats: null,
    };
  },
  props: {
    streamEvent: Object,
    state: Object,
    DetectRTC: Object,
    participants: Map,
    connection: Object,
  },
  methods: {
    switchFullscreen: function () {
      this.fullscreen = !this.fullscreen;
      this.state.fullScreenMode = !this.state.fullScreenMode;
    },
    switchHalfScreen: function () {
      if (this.participants.size <= 1 && !this.halfscreen) return;
      if (this.DetectRTC.isMobileDevice) return;
      if (this.state.halfScreenMode && !this.halfscreen) return;
      if (this.state.fullScreenMode) return;
      
      this.state.halfScreenMode = !this.state.halfScreenMode;
      this.halfscreen = !this.halfscreen;

      if(!this.halfscreen && this.halfscreenTimer != null ){
        clearInterval(this.halfscreenTimer);
        this.halfscreenTimer = null;
        return;
      }
      if(this.halfscreen && this.halfscreenTimer == null){
        var self = this;
        this.halfscreenTimer = setInterval(() =>{
          if (self.halfscreen && self.participants.size <= 1)
            self.switchHalfScreen();
        }, 2000)
      }
    },
    getInitials: function () {
      var username = CommonUtils.getUserNameFromEvent(this.streamEvent);
      return CommonUtils.getInitials(username);
    },
    clearMediaElements: function () {
      try {
        var card = document.getElementById("card-" + this.streamEvent.userid);
        for (const el of card.getElementsByTagName("video"))
          el.parentNode.removeChild(el);
        for (const el of card.getElementsByTagName("audio"))
          el.parentNode.removeChild(el);
      } catch (e) {
        // eslint-disable-next-line
        console.error("ClearMediaElements Error", e.message);
      }
    },
    tryGetProfile: function () {
      this.profile.avatar = CommonUtils.getAvatarFromEvent(this.streamEvent);
      this.profile.username = CommonUtils.getUserNameFromEvent(
        this.streamEvent
      );
    },
    streamValidate: function(){
      if (this.connection.userid === this.streamEvent.userid) return;
      if(!this.streamEvent.mediaElement) return;
      if(!this.streamEvent.mediaElement.srcObject) return;
      var hasVideoTracks = this.streamEvent.mediaElement.srcObject.getVideoTracks().length > 0;
      var hasAudioTracks = this.streamEvent.mediaElement.srcObject.getAudioTracks().length > 0;
      if((!this.streamEvent.extra.videoMuted && !hasVideoTracks)
          || (!this.streamEvent.extra.audioMuted && !hasAudioTracks))
          this.connection.socket.emit('renegotiate-needed', {
            remoteUserId: this.streamEvent.userid,
            sender: this.connection.userid
          });
    },
    enablePeerStats: function (event) {
      if (event.type && event.type == "local") return;
      if (this.connection.userid === event.userid) return;
      if (!this.connection.peers[event.userid]) return;
      if (this.peerStats) this.peerStats.stop();
      var self = this;
      this.peerStats = new PeerStats(this.connection.peers[event.userid].peer);
      this.peerStats.start((stats) => {
        self.stats = stats;
      }, 3000);
    },
    streamEventChangeCallback: function(){
      this.$forceUpdate();
    },
    prepare: function (event) {
      event.changeCallback = this.streamEventChangeCallback;
      var card = document.getElementById("card-" + event.userid);
      if(card == null){
        var self = this;
        setTimeout(() =>{
          self.prepare(event);
        }, 1000)
      }
      if (event.mediaElement != null) {
        event.mediaElement.controls = false;
        if (event.type == "local") event.mediaElement.muted = true;
      }
      card.appendChild(event.mediaElement);
      setTimeout(() => {
        if (event.mediaElement.play) event.mediaElement.play();
        if (event.type == "local") event.mediaElement.muted = true;
      }, 1000);
    },
  },
  watch: {
    // eslint-disable-next-line
    streamEvent: function (newVal, oldVal) {
      var self = this;
      setTimeout(() => {
        self.clearMediaElements();
        self.prepare(newVal);
        self.tryGetProfile();
        self.enablePeerStats(newVal);
      }, 400);
    }
  },
  mounted: function () {
    var self = this;
    setTimeout(() => {
      self.prepare(this.streamEvent);
      self.tryGetProfile();
      self.enablePeerStats(this.streamEvent);
      self.streamValidateTimer = setInterval(
        self.streamValidate,
        2000
      );
    }, 400);
  },
  destroyed: function () {
    if (this.peerStats) this.peerStats.stop();
    if (!this.halfscreen) return;
    this.state.halfScreenMode = false;
    if(this.halfscreenTimer != null){
      clearInterval(this.halfscreenTimer);
      this.halfscreenTimer = null;
    }
    if(this.streamValidateTimer != null){
      clearInterval(this.streamValidateTimer);
      this.streamValidateTimer = null;
    }
  },
};
</script>

<style>
.user-block {
  min-width: 355px;
  overflow: hidden;
  border-radius: 18px;
  border-style: hidden;
  max-height: calc(100vh - 169px);
  background-color: black;
  min-height: 250px;
  margin-bottom: 1em !important;
}
.user-block video {
  background-color: transparent;
  z-index: 1;
  height: 100%;
}
@-moz-document url-prefix() {
  .user-block video {
    background-color: transparent;
    z-index: 1;
    height: inherit;
  }
  .half-screen video{
    height: unset;
  }
}
.user-block .b-avatar {
  position: absolute;
  z-index: 0;
  left: calc(50% - 100px);
  bottom: calc(50% - 100px);
  width: 200px;
  height: 200px;
  font-size: 4em;
}
.b-avatar-half {
  left: calc(50% - 50px) !important;
  bottom: calc(50% - 50px) !important;
  width: 100px !important;
  height: 100px !important;
}
.username-span {
  position: absolute;
  background-color: rgb(255, 255, 255, 0.32);
  width: 100%;
  overflow: hidden;
  overflow-wrap: normal;
  color: black;
  font-weight: bold;
  z-index: 2;
}
.pseudo-fullscreen {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100% !important;
  min-height: calc(100% - 48px);
  max-height: calc(100% - 48px);
  padding: 0px !important;
  margin: 0px !important;
  border-radius: 0px;
  max-width: unset !important;
}
.connection-info {
  position: absolute;
  left: 1em;
  top: 1.8em;
  z-index: 40;
  border-style: hidden;
}
.audio-muted-icon {
  position: absolute;
  left: 1em;
  bottom: 1em;
  z-index: 30;
}
.video-muted-icon {
  z-index: 30;
  position: absolute;
  left: 2.5em;
  bottom: 1em;
}
.fullscreen-button {
  position: absolute;
  bottom: 1em;
  right: 1em;
  z-index: 40;
  color: white;
  border-style: hidden;
}
.fullscreen-button .b-icon {
  padding-top: 1px;
}
.switch-half-screen {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 39;
  background-color: transparent;
  cursor: pointer;
}
.half-screen {
  position: fixed;
  width: calc(100% - 285px);
  height: 100%;
  z-index: 0;
  padding: 0px;
  left: 0;
  margin: 0px 0px 0px 1.5em;
}
.has-avatar {
  background-color: transparent !important;
}
</style>