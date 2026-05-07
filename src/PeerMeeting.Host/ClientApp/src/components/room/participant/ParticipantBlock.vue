<template>
  <div
    class="user-block card text-white"
    :class="[
      { 'user-block--spotlight': isSpotlight },
      { 'user-block--thumbnail': isThumbnail },
      { 'user-block--speaking': streamEvent.extra.speacking },
    ]"
    :id="'card-' + streamEvent.userid"
  >
    <span class="username-span">{{ profile.username }}</span>
    <b-avatar
      :class="[profile.avatar ? 'has-avatar' : '']"
      :src="profile.avatar"
      :text="getInitials()"
    ></b-avatar>

    <div
      class="spotlight-toggle-overlay"
      v-if="!isThumbnail && !isSpotlight"
      @click="$emit('toggleSpotlight')"
    ></div>

    <div
      class="spotlight-toggle-overlay spotlight-exit-overlay"
      v-if="isSpotlight"
      @click="$emit('toggleSpotlight')"
    ></div>

    <b-button
      class="fullscreen-button"
      size="sm"
      variant="outline-light"
      @click.stop="toggleFullscreen"
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
    isSpotlight: {
      type: Boolean,
      default: false,
    },
    isThumbnail: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    toggleFullscreen(event) {
      event.stopPropagation()
      this.fullscreen = !this.fullscreen
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
    streamEventChangeCallback() {
      this.$forceUpdate()
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
    if (this.streamValidateTimer != null) {
      clearInterval(this.streamValidateTimer)
      this.streamValidateTimer = null
    }
  },
}
</script>

<style scoped>
.user-block {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  max-height: unset;
  overflow: hidden;
  border-radius: 12px;
  border-style: hidden;
  background-color: black;
  transition: box-shadow 0.4s;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.user-block .b-avatar {
  position: absolute;
  z-index: 0;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  font-size: 4em;
}

.user-block--thumbnail .b-avatar {
  width: 80px !important;
  height: 80px !important;
  font-size: 2em !important;
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
  padding: 4px 8px;
  box-sizing: border-box;
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

.has-avatar {
  background-color: transparent !important;
}

.spotlight-toggle-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 10;
  background-color: transparent;
  cursor: pointer;
}

.user-block--speaking {
  box-shadow: 0 0 10px 4px lightblue;
}

/* Thumbnail mode — smaller */
.user-block--thumbnail {
  border-radius: 8px;
  min-height: 120px !important;
}

.user-block--thumbnail .username-span {
  font-size: 0.75em;
  padding: 2px 6px;
}

.user-block--thumbnail .audio-muted-icon,
.user-block--thumbnail .video-muted-icon {
  font-size: 0.85em;
}

.user-block--thumbnail .fullscreen-button {
  display: none;
}

/* Spotlight mode — fills available space */
.user-block--spotlight {
  border-radius: 12px;
}

@media (max-width: 768px) {
  .user-block .b-avatar {
    width: 100px;
    height: 100px;
    font-size: 2.5em;
  }

  .user-block--thumbnail .b-avatar {
    width: 50px !important;
    height: 50px !important;
    font-size: 1.5em !important;
  }
}
</style>
<style>
.user-block video {
  background-color: transparent;
  z-index: 1;
  /* width: 100%; */
  height: 100%;
  object-fit: cover;
}
</style>