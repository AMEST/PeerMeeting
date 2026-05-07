<template>
  <div
    class="card text-white user-block"
    :class="[
      fullscreen ? 'pseudo-fullscreen' : '',
      halfscreen ? 'half-screen' : '',
      streamEvent.extra.speacking ? 'speaking' : '',
    ]"
    :style="
      halfscreen
        ? 'max-height: unset!important;height: 80%!important; max-width: unset;'
        : ''
    "
    :id="'card-' + streamEvent.userid"
  >
    <span class="username-span">{{ profile.username }}</span>
    <b-avatar
      :class="[
        state.halfScreenMode && !halfscreen ? 'b-avatar-half' : '',
        profile.avatar ? 'has-avatar' : '',
      ]"
      :src="profile.avatar"
      :text="getInitials()"
    ></b-avatar>

    <b-button
      class="fullscreen-button"
      size="sm"
      variant="outline-light"
      @click="switchFullscreen"
      :disabled="state.halfScreenMode"
    >
      <b-icon v-if="!fullscreen" icon="fullscreen" />
      <b-icon v-else icon="fullscreen-exit" />
    </b-button>

    <connection-info
      v-if="streamEvent.type !== 'local'"
      :userId="streamEvent.userid"
      :stats="stats"
    />

    <b-icon
      class="audio-muted-icon"
      :icon="streamEvent.extra.audioMuted ? 'mic-mute' : 'mic'"
      :style="streamEvent.extra.audioMuted ? 'color: red' : ''"
    ></b-icon>
    <b-icon
      class="video-muted-icon"
      :icon="streamEvent.extra.videoMuted ? 'camera-video-off' : 'camera-video'"
      :style="streamEvent.extra.videoMuted ? 'color: red' : ''"
    ></b-icon>
    <control-menu
      v-if="streamEvent.type !== 'local'"
      :userId="streamEvent.userid"
      :connection="connection"
    />

    <div class="switch-half-screen" @click="switchHalfScreen"></div>
  </div>
</template>

<script>
import CommonUtils from '@/CommonUtils'
import PeerStats from '@/services/PeerStats'
import ConnectionInfo from '@/components/room/participant/ConnectionInfo'
import ControlMenu from '@/components/room/participant/ControlMenu.vue'

export default {
  name: 'ParticipantBlock',
  components: {
    ConnectionInfo,
    ControlMenu,
  },
  data: () => ({
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
      stunOrTurn: { local: '', remote: '' },
      ips: { local: '', remote: '' },
      transport: { local: '', remote: '' },
      data: { send: 0, receive: 0 },
      packets: { send: 0, receive: 0 },
      codecs: { local: '', remote: '' },
      connectionState: '',
      rtt: 0.0,
    },
    peerStats: null,
  }),
  props: {
    streamEvent: Object,
    state: Object,
    DetectRTC: Object,
    participants: Map,
    connection: Object,
  },
  methods: {
    switchFullscreen() {
      this.fullscreen = !this.fullscreen
      this.state.fullScreenMode = !this.state.fullScreenMode
    },
    switchHalfScreen() {
      if (this.participants.size <= 1 && !this.halfscreen) return
      if (this.DetectRTC.isMobileDevice) return
      if (this.state.halfScreenMode && !this.halfscreen) return
      if (this.state.fullScreenMode) return

      this.state.halfScreenMode = !this.state.halfScreenMode
      this.halfscreen = !this.halfscreen

      if (!this.halfscreen && this.halfscreenTimer != null) {
        clearInterval(this.halfscreenTimer)
        this.halfscreenTimer = null
        return
      }
      if (this.halfscreen && this.halfscreenTimer == null) {
        this.halfscreenTimer = setInterval(() => {
          if (this.halfscreen && this.participants.size <= 1) {
            this.switchHalfScreen()
          }
        }, 2000)
      }
    },
    getInitials() {
      const username = CommonUtils.getUserNameFromEvent(this.streamEvent)
      return CommonUtils.getInitials(username)
    },
    clearMediaElements() {
      try {
        const card = document.getElementById('card-' + this.streamEvent.userid)
        if (!card) return
        for (const el of card.getElementsByTagName('video')) {
          el.parentNode.removeChild(el)
        }
        for (const el of card.getElementsByTagName('audio')) {
          el.parentNode.removeChild(el)
        }
      } catch (e) {
        console.error('ClearMediaElements Error', e.message)
      }
    },
    tryGetProfile() {
      this.profile.avatar = CommonUtils.getAvatarFromEvent(this.streamEvent)
      this.profile.username = CommonUtils.getUserNameFromEvent(this.streamEvent)
    },
    streamValidate() {
      if (this.connection.connection.userid === this.streamEvent.userid) return
      if (!this.streamEvent.mediaElement) return
      if (!this.streamEvent.mediaElement.srcObject) return
      const hasVideoTracks =
        this.streamEvent.mediaElement.srcObject.getVideoTracks().length > 0
      const hasAudioTracks =
        this.streamEvent.mediaElement.srcObject.getAudioTracks().length > 0
      if (
        (!this.streamEvent.extra.videoMuted && !hasVideoTracks) ||
        (!this.streamEvent.extra.audioMuted && !hasAudioTracks)
      ) {
        this.connection.connection.socket.emit('renegotiate-needed', {
          remoteUserId: this.streamEvent.userid,
          sender: this.connection.connection.userid,
        })
      }
    },
    enablePeerStats(event) {
      if (event.type && event.type === 'local') return
      if (this.connection.connection.userid === event.userid) return
      if (!this.connection.connection.peers[event.userid]) return
      if (this.peerStats) this.peerStats.stop()
      this.peerStats = new PeerStats(
        this.connection.connection.peers[event.userid].peer
      )
      this.peerStats.start((stats) => {
        this.stats = stats
      }, 5000)
    },
    streamEventChangeCallback() {
      this.$forceUpdate()
    },
    prepare(event) {
      event.changeCallback = this.streamEventChangeCallback
      const card = document.getElementById('card-' + event.userid)
      if (card == null) {
        setTimeout(() => this.prepare(event), 1000)
        return
      }
      if (event.mediaElement == null) return
      event.mediaElement.controls = false
      if (event.type === 'local') event.mediaElement.muted = true
      card.appendChild(event.mediaElement)
      setTimeout(() => {
        if (event.mediaElement.play) event.mediaElement.play()
        if (event.type === 'local') event.mediaElement.muted = true
      }, 1000)
    },
  },
  watch: {
    streamEvent(newValue) {
      setTimeout(() => {
        this.clearMediaElements()
        this.prepare(newValue)
        this.tryGetProfile()
        this.enablePeerStats(newValue)
      }, 400)
    },
  },
  mounted() {
    setTimeout(() => {
      this.prepare(this.streamEvent)
      this.tryGetProfile()
      this.enablePeerStats(this.streamEvent)
      this.streamValidateTimer = setInterval(() => this.streamValidate(), 2000)
    }, 400)
  },
  destroyed() {
    if (this.peerStats) this.peerStats.stop()
    if (!this.halfscreen) return
    this.state.halfScreenMode = false
    if (this.halfscreenTimer != null) {
      clearInterval(this.halfscreenTimer)
      this.halfscreenTimer = null
    }
    if (this.streamValidateTimer != null) {
      clearInterval(this.streamValidateTimer)
      this.streamValidateTimer = null
    }
  },
}
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
  transition: box-shadow 0.4s;
  justify-content: center;
}
.user-block video {
  background-color: transparent;
  z-index: 1;
  height: 100%;
}
@-moz-document url-prefix() {
  .half-screen video {
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
  top: 0;
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
.audio-muted-icon {
  position: absolute;
  left: 1em;
  bottom: 1.3em;
  z-index: 30;
}
.video-muted-icon {
  z-index: 30;
  position: absolute;
  left: 2.5em;
  bottom: 1.3em;
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
.speaking {
  box-shadow: 0 0 10px 10px lightblue;
}
</style>
