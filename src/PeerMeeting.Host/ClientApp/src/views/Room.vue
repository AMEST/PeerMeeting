<template>
  <div class="room">
    <b-container fluid>
      <div class="room-container"><h3 class="room-name">{{ roomId }}</h3></div>
      <b-card-group
        deck
        id="videos-container"
        class="justify-content-center"
        :class="[state.halfScreenMode ? 'half-screen-container' : '']"
      >
        <participant-block
          v-for="[k, v] in participants"
          :key="k"
          :streamEvent="v"
          :state="state"
          :DetectRTC="DetectRTC"
          :participants="participants"
          :connection="rtcConnection"
          :class="
            participants.size <= 2
              ? 'only-local-participant'
              : 'many-participants'
          "
        ></participant-block>
      </b-card-group>
      <chat
        :style="state.chatOpened ? '' : 'visibility:hidden'"
        :roomId="rtcConnection.connection.channel"
        :state="state"
      />
      <control-bar
        :stateService="stateService"
        :DetectRTC="DetectRTC"
        :streamAddCallback="addParticipantBlock"
      />
    </b-container>
  </div>
</template>

<script>
import RTCUtils from '@/RTCUtils'
import RTCStateService from '@/services/RTCStateService'
import PeerMeetingRtcMulticonnection from '@/services/PeerMeetingRtcMulticonnection'
import CommonUtils from '@/CommonUtils'
import ParticipantBlock from '@/components/room/participant/ParticipantBlock.vue'
import Chat from '@/components/room/Chat.vue'
import ControlBar from '@/components/room/ControlBar.vue'
require('adapterjs')

export default {
  name: 'room',
  data: () => ({
    roomId: '',
    rtcConnection: null,
    stateService: null,
    participants: new Map(),
    DetectRTC: require('detectrtc'),
  }),
  components: {
    ParticipantBlock,
    ControlBar,
    Chat,
  },
  computed: {
    state() {
      if (this.stateService == null) {
        return { halfScreenMode: false }
      }
      return this.stateService.state
    },
  },
  methods: {
    addParticipantBlock(event) {
      if (this.participants.has(event.userid) && event.cardfix) return
      if (this.participants.has(event.userid)) {
        this.participants.delete(event.userid)
      }
      event.extra = CommonUtils.extractExtraData(this.rtcConnection.connection, event.userid)
      this.participants.set(event.userid, event)
      this.$forceUpdate()
      if (
        this.rtcConnection.connection.userid === event.userid &&
        event.type === 'local'
      ) {
        RTCUtils.setHarkHandler(this.rtcConnection.connection, event.stream)
      }
    },
    streamEnded(event) {
      if (!this.participants.has(event.userid)) return
      this.participants.delete(event.userid)
      this.$forceUpdate()

      const peer = this.rtcConnection.connection.peers[event.userid]
      if (
        this.rtcConnection.connection.userid === event.userid ||
        (peer &&
          peer.peer &&
          peer.peer.connectionState &&
          peer.peer.connectionState === 'connected')
      ) {
        return
      }

      const username = CommonUtils.getUserNameFromEvent(event)
      this.$bvToast.toast(
        this.$t('room.notifications.user') + username + this.$t('room.notifications.left'),
        {
          title: this.$t('room.notifications.title'),
          variant: 'info',
          solid: true,
        }
      )
    },
    userStatusChanged(event) {
      if (
        this.participants.has(event.userid) &&
        event.status === 'online' &&
        event.extra
      ) {
        const participant = this.participants.get(event.userid)
        participant.extra = event.extra
        if (participant.changeCallback) participant.changeCallback()
        return
      }
      if (this.participants.has(event.userid) || event.status === 'offline') return
      const username = CommonUtils.getUserNameFromEvent(event)
      this.$bvToast.toast(
        this.$t('room.notifications.user') + username + this.$t('room.notifications.joined'),
        {
          title: this.$t('room.notifications.title'),
          variant: 'info',
          solid: true,
        }
      )
      this.addParticipantBlock({
        userid: event.userid,
        mediaElement: document.createElement('div'),
        cardfix: true,
        streamid: null,
      })
    },
    initialize() {
      try {
        this.rtcConnection = new PeerMeetingRtcMulticonnection(
          this.$store,
          this.$router,
          this.participants
        )
        this.stateService = new RTCStateService(this.rtcConnection, this.$store)
      } catch (e) {
        console.error('Error Initialize RTCMultuConnection', e)
        window.location.reload()
      }
      this.rtcConnection.setOnStream(this.addParticipantBlock)
      this.rtcConnection.setOnStreamEnded(this.streamEnded)
      this.rtcConnection.setOnUserStatusChanged(this.userStatusChanged)
      this.rtcConnection.setOnMuteForcibly(() => {
        this.stateService.state.audioEnabled = false
      })
      this.rtcConnection.configureMediaError(this.mediaErrorCallback)
    },
    mediaErrorCallback(videoState, audioState) {
      this.stateService.state.videoEnabled = videoState
      this.stateService.state.audioEnabled = audioState
      this.stateService.state.hasWebcam = videoState
      this.stateService.state.hasMicrophone = audioState
      this.rtcConnection.connection.extra.audioMuted = !audioState
      this.rtcConnection.connection.extra.videoMuted = !videoState
      this.addParticipantBlock({
        streamid: null,
        userid: this.rtcConnection.connection.userid,
        mediaElement: document.createElement('div'),
      })
    },
    addToHistory() {
      CommonUtils.addToHistory(this.$store, {
        id: this.roomId,
        date: new Date(),
      })
    },
    inputDeviceChanged() {
      this.rtcConnection.configureMediaError()
      this.rtcConnection.configureMediaConstraints()
      this.rtcConnection.connection.dontCaptureUserMedia = false
      this.stateService.state.hasWebcam = true
      this.stateService.state.hasMicrophone = true

      if (this.stateService.state.screenEnabled) return

      this.stateService.state.audioEnabled = true
      this.stateService.state.videoEnabled = true
      RTCUtils.addBaseStream(
        this.rtcConnection.connection,
        this.state,
        this.$store.state.application.deviceSettings
      ).then(this.addParticipantBlock)
    },
  },
  created() {
    this.roomId = this.$route.params.id
    this.addToHistory()
    this.initialize()
    this.rtcConnection.join(this.roomId)
    this.$store.commit('addDeviceChangedCallback', this.inputDeviceChanged)
  },
  beforeDestroy() {
    if (this.rtcConnection) {
      this.rtcConnection.leave()
      this.rtcConnection.stop()
    }
    this.$store.commit('clearDeviceChangedCallbacks')
  },
  watch: {
    $route(to) {
      this.roomId = to
      this.rtcConnection.leave()
      this.rtcConnection.stop()
      this.addToHistory()
      this.initialize()
      this.rtcConnection.join(this.roomId)
    },
  },
}
</script>

<style scoped>
.room-name {
  color: var(--bs-body-color);
  font-weight: bold;
  max-width: 43%;
  max-height: 30px;
  word-break: break-all;
  overflow: hidden;
  margin-left: auto;
  margin-right: auto;
}
@media (max-width: 801px) {
  .room-name {
    margin-left: 10px!important;
    max-width: 70%;
    text-align: left;
  }
}
.room-container {
  pointer-events: none;
  position: fixed;
  top: 10px;
  left: 0;
  width: 100%;
  z-index: 1000;
}
.card-deck {
  max-height: calc(100vh - 108px);
  min-height: calc(100vh - 108px);
  align-items: center;
  position: relative;
}
.card-deck .card {
  margin-right: unset !important;
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
  align-content: center;
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
</style>
