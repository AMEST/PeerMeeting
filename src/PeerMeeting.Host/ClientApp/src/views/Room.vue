<template>
  <div class="room">
    <b-container fluid>
      <div class="room-container">
        <h3 class="room-name">{{ roomId }}</h3>
      </div>

      <div
        :class="[
          'video-grid',
          fullscreenMode ? 'video-grid--fullscreen' : spotlightMode ? 'video-grid--spotlight' : `video-grid--${gridClass}`,
        ]"
      >
        <!-- Fullscreen mode: only selected participant -->
        <template v-if="fullscreenMode && fullscreenParticipant">
          <participant-block
            :key="fullscreenParticipant[0]"
            :streamEvent="fullscreenParticipant[1]"
            :state="state"
            :participants="participants"
            :connection="rtcConnection"
            :isFullscreen="true"
            @toggleFullscreen="toggleFullscreen(fullscreenParticipant[0])"
          />
        </template>

        <!-- Spotlight mode: selected participant + sidebar -->
        <template v-else-if="spotlightMode && selectedParticipant">
          <div class="spotlight-main">
            <participant-block
              :key="selectedParticipant[0]"
              :streamEvent="selectedParticipant[1]"
              :state="state"
              :participants="participants"
              :connection="rtcConnection"
              :isSpotlight="true"
              @toggleSpotlight="clearSpotlight"
              @toggleFullscreen="toggleFullscreen(selectedParticipant[0])"
            />
          </div>
          <div class="spotlight-sidebar">
            <participant-block
              v-for="[k, v] in otherParticipants"
              :key="k"
              :streamEvent="v"
              :state="state"
              :participants="participants"
              :connection="rtcConnection"
              :isThumbnail="true"
              @toggleSpotlight="selectParticipant(k)"
              @toggleFullscreen="toggleFullscreen(k)"
            />
          </div>
        </template>

        <!-- Normal grid mode -->
        <template v-else>
          <participant-block
            v-for="[k, v] in participantList"
            :key="k"
            :streamEvent="v"
            :state="state"
            :participants="participants"
            :connection="rtcConnection"
            @toggleSpotlight="selectParticipant(k)"
            @toggleFullscreen="toggleFullscreen(k)"
          />
        </template>
      </div>

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
    participantVersion: 0,
    selectedParticipantId: null,
    fullscreenParticipantId: null,
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
        return {}
      }
      return this.stateService.state
    },
    participantCount() {
      void this.participantVersion
      return this.participants.size
    },
    participantList() {
      void this.participantVersion
      return Array.from(this.participants.entries())
    },
    fullscreenMode() {
      return this.fullscreenParticipantId !== null
    },
    fullscreenParticipant() {
      if (!this.fullscreenParticipantId) return null
      return [
        this.fullscreenParticipantId,
        this.participants.get(this.fullscreenParticipantId),
      ]
    },
    spotlightMode() {
      return this.selectedParticipantId !== null && this.participantCount > 2
    },
    selectedParticipant() {
      if (!this.selectedParticipantId) return null
      return [
        this.selectedParticipantId,
        this.participants.get(this.selectedParticipantId),
      ]
    },
    otherParticipants() {
      void this.participantVersion
      const result = []
      for (const [k, v] of this.participants) {
        if (k !== this.selectedParticipantId) {
          result.push([k, v])
        }
      }
      return result
    },
    gridClass() {
      const count = this.participantCount
      if (count <= 1) return 'single'
      if (count === 2) return 'dual'
      if (count <= 4) return 'quad'
      if (count <= 6) return 'six'
      return 'many'
    },
  },
  methods: {
    selectParticipant(id) {
      if (this.participantCount <= 2) return
      if (this.fullscreenMode) {
        this.fullscreenParticipantId = null
      }
      if (this.selectedParticipantId === id) {
        this.selectedParticipantId = null
      } else {
        this.selectedParticipantId = id
      }
    },
    clearSpotlight() {
      this.selectedParticipantId = null
    },
    toggleFullscreen(id) {
      if (this.fullscreenMode) {
        this.fullscreenParticipantId = null
      } else {
        this.fullscreenParticipantId = id
      }
    },
    addParticipantBlock(event) {
      if (this.participants.has(event.userid) && event.cardfix) return
      if (this.participants.has(event.userid)) {
        this.participants.delete(event.userid)
      }
      event.extra = CommonUtils.extractExtraData(
        this.rtcConnection.connection,
        event.userid
      )
      this.participants.set(event.userid, event)
      this.participantVersion++
      if (
        this.rtcConnection.connection.userid === event.userid &&
        event.type === 'local'
      ) {
        RTCUtils.setHarkHandler(
          this.rtcConnection.connection,
          event.stream
        )
      }
    },
    streamEnded(event) {
      if (!this.participants.has(event.userid)) return
      this.participants.delete(event.userid)
      this.participantVersion++

      if (this.selectedParticipantId === event.userid) {
        this.selectedParticipantId = null
      }

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
        this.$t('room.notifications.user') +
          username +
          this.$t('room.notifications.left'),
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
      if (this.participants.has(event.userid) || event.status === 'offline')
        return
      const username = CommonUtils.getUserNameFromEvent(event)
      this.$bvToast.toast(
        this.$t('room.notifications.user') +
          username +
          this.$t('room.notifications.joined'),
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
        this.stateService = new RTCStateService(
          this.rtcConnection,
          this.$store
        )
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
    participantCount(newCount) {
      if (newCount <= 2 && this.selectedParticipantId) {
        this.selectedParticipantId = null
      }
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
    margin-left: 10px !important;
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

/* ===== CSS Grid Layout ===== */

.video-grid {
  display: grid;
  gap: 8px;
  width: 100%;
  height: calc(100vh - 108px);
  padding: 8px;
  grid-auto-rows: minmax(0, 1fr);
}

/* 1 participant */
.video-grid--single {
  grid-template-columns: 1fr;
}

/* Fullscreen mode */
.video-grid--fullscreen {
  grid-template-columns: 1fr;
}

.video-grid--fullscreen .user-block {
  border-radius: 0;
}

/* 2 participants */
.video-grid--dual {
  grid-template-columns: repeat(2, 1fr);
}

/* 3-4 participants — 2x2 */
.video-grid--quad {
  grid-template-columns: repeat(2, 1fr);
}

/* 5-6 participants — 3x2 */
.video-grid--six {
  grid-template-columns: repeat(3, 1fr);
}

/* 7+ participants — auto-fill */
.video-grid--many {
  grid-template-columns: repeat(3, 1fr);
}

/* ===== Spotlight Mode (2/3 + 1/3) ===== */

.video-grid--spotlight {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr;
  gap: 8px;
}

.spotlight-main {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.spotlight-sidebar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  max-height: calc(100vh - 108px);
  padding: 4px;
}

.spotlight-sidebar .user-block {
  flex-shrink: 0;
  min-width: unset;
  min-height: unset;
  height: auto;
  aspect-ratio: 1.5;
  width: 100%;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.spotlight-sidebar .user-block:hover {
  box-shadow: 0 0 0 2px var(--bs-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .video-grid--dual {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }

  .video-grid--six,
  .video-grid--many {
    grid-template-columns: 1fr 1fr;
  }

  .video-grid--spotlight {
    grid-template-columns: 1fr;
    grid-template-rows: 2fr 1fr;
  }

  .spotlight-sidebar {
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    max-height: 150px;
  }

  .spotlight-sidebar .user-block {
    min-width: 160px;
    min-height: unset !important;
    max-width: fit-content;
  }
}

@media (max-width: 380px) {
  .container-fluid {
    padding-left: 0px !important;
    padding-right: 0px !important;
  }
}
</style>
