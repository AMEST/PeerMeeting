/* eslint-disable */
import WebRtcSignalR from '@/WebRtcHub'
import RTCUtils from '@/RTCUtils'
import RTCMultiConnection from 'rtcmulticonnection'
import { v4 as uuidv4 } from 'uuid'

export default class PeerMeetingRtcMulticonnection {
  detectRTC = require('detectrtc')
  connection = null
  userid = null
  participantsFixTimer = null
  participantsCardFixTimer = null
  triedTurnOnly = false

  constructor(store, router, participants) {
    this.store = store
    this.router = router
    this.participants = participants
    this.connection = new RTCMultiConnection()
    this.generateUserId()
    this.configureExtraData()
    this.connection.setCustomSocketHandler(WebRtcSignalR)
    this.configureMediaConstraints()
    this.connection.codecs.video = 'VP8'
    this.connection.session = {
      audio: true,
      video: true,
    }
    this.connection.sdpConstraints.mandatory = {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true,
    }
    this.configureIceServers()
    this.configureKicked()
    this.configureMute()
    this.configureVoiceDetection()
    this.configureIceConnectionState()
    this.startParticipantFixTimer()
  }

  join(roomId) {
    this.connection.join(roomId)
  }

  leave() {
    this.connection.leave()
  }

  stop() {
    clearInterval(this.participantsFixTimer)
    clearInterval(this.participantsCardFixTimer)
    this.connection.close()
  }

  setOnStream(callback) {
    this.connection.onstream = callback
  }

  setOnUserStatusChanged(callback) {
    this.connection.onUserStatusChanged = callback
  }

  setOnMuteForcibly(callback) {
    this.connection.onMuteForcibly = callback
  }

  setOnStreamEnded(callback) {
    this.connection.onstreamended = (event) => {
      callback(event)
      const mediaElement = document.getElementById(event.streamid)
      if (mediaElement) {
        mediaElement.parentNode.removeChild(mediaElement)
      }
    }
  }

  configureMediaError(onMediaStateChange) {
    RTCUtils.configureMediaError(
      this.connection,
      this.detectRTC,
      this.store.state.application.deviceSettings,
      onMediaStateChange
    )
  }

  configureMediaConstraints() {
    this.connection.mediaConstraints = {
      audio: this.store.state.application.deviceSettings.audioInput
        ? { deviceId: this.store.state.application.deviceSettings.audioInput }
        : true,
      video: this.store.state.application.deviceSettings.videoInput
        ? { deviceId: this.store.state.application.deviceSettings.videoInput }
        : true,
    }
  }

  generateUserId() {
    this.connection.userid = uuidv4() + '|' + this.store.state.application.profile.name
    this.userid = this.connection.userid
  }

  configureExtraData() {
    this.connection.extra = {
      profile: this.store.state.application.profile,
      audioMuted: false,
      videoMuted: false,
      speacking: false,
    }
  }

  configureIceServers() {
    if (!this.store.state.application.turnSettings)
      return
    if (this.store.state.application.turnOnly || this.triedTurnOnly) {
      this.connection.iceServers = []
      this.connection.candidates.host = false
      this.connection.iceTransportPolicy = 'relay'
    }
    const turnUri = this.store.state.application.turnSettings.uris[0]
    const stunUri = turnUri.replace(/^turn:/, 'stun:').replace(/\?transport=tcp$/, '').replace(/\?transport=udp$/, '')
    this.connection.iceServers.unshift({
      urls: stunUri,
    })
    this.connection.iceServers.push({
      urls: this.store.state.application.turnSettings.uris[0],
      credential: this.store.state.application.turnSettings.password,
      username: this.store.state.application.turnSettings.username,
    })
    this.connection.iceServers.push({
      urls: this.store.state.application.turnSettings.uris[1],
      credential: this.store.state.application.turnSettings.password,
      username: this.store.state.application.turnSettings.username,
    })
  }

  configureKicked() {
    this.connection.onKicked = () => {
      this.router.push(window.location.pathname + '/ended')
    }
  }

  configureMute() {
    this.connection.onmute = (e) => {
      if (!e || !e.mediaElement) return
      if (e.muteType === 'both' || e.muteType === 'video') {
        e.mediaElement.hidden = true
      } else if (e.muteType === 'audio') {
        e.mediaElement.muted = true
      }
    }

    const originalOnUnmute = this.connection.onunmute
    this.connection.onunmute = (e) => {
      originalOnUnmute(e)
      if (!e || !e.mediaElement) return
      if (e.userid === this.connection.userid) {
        e.mediaElement.muted = true
      }
      if (e.mediaElement.tagName === 'VIDEO' && e.unmuteType === 'video') {
        e.mediaElement.hidden = false
      }
    }
  }

  configureVoiceDetection() {
    this.connection.onspeaking = () => {
      this.connection.extra.speacking = true
      this.connection.updateExtraData()
    }

    this.connection.onsilence = () => {
      this.connection.extra.speacking = false
      this.connection.updateExtraData()
    }
  }

  configureIceConnectionState() {
    this.connection.onPeerStateChanged = (event) => {
      const state = event.iceConnectionState
      if ((state === 'failed' || state === 'disconnected') && !this.triedTurnOnly && !this.store.state.application.turnOnly) {
        this.triedTurnOnly = true
        console.warn('ICE connection failed, switching to TURN only mode')
        this.store.commit('changeTurnOnly', true)
        this.reapplyIceServers()
      }
    }
  }

  reapplyIceServers() {
    if (!this.store.state.application.turnSettings)
      return
    this.connection.iceServers = []
    this.configureIceServers()
    const roomId = this.connection.sessionid
    const participants = this.connection.getAllParticipants()
    participants.forEach((participant) => {
      this.connection.remove(participant)
    })
    setTimeout(() => {
      this.connection.join(roomId)
    }, 1000)
  }

  startParticipantFixTimer() {
    if (this.participantsFixTimer != null) {
      clearInterval(this.participantsFixTimer)
    }

    this.participantsFixTimer = setInterval(() => {
      const connectedParticipants = this.connection.getAllParticipants()
      for (const key of this.participants.keys()) {
        if (
          (connectedParticipants.indexOf(key) === -1 && this.connection.userid !== key) ||
          (this.connection.peers[key] && this.connection.peers[key].peer.connectionState === 'failed')
        ) {
          this.connection.onstreamended({ userid: key })
        }
      }
    }, 5000)

    if (this.participantsCardFixTimer != null) {
      clearInterval(this.participantsCardFixTimer)
    }

    this.participantsCardFixTimer = setInterval(() => {
      this.connection.peers.getAllParticipants().forEach((e) => {
        if (
          !this.participants.has(e) &&
          this.connection.peers[e] &&
          this.connection.peers[e].peer &&
          this.connection.peers[e].peer.connectionState &&
          this.connection.peers[e].peer.connectionState === 'connected'
        ) {
          if (!this.connection.peers[e].peer.participantCardError) {
            this.connection.peers[e].peer.participantCardError = 0
          }
          this.connection.peers[e].peer.participantCardError += 1

          if (this.connection.peers[e].peer.participantCardError > 6) {
            this.connection.onstream({
              streamid: null,
              userid: e,
              extra: this.connection.peers[e].extra,
              cardfix: true,
              mediaElement: document.createElement('div'),
            })
            this.connection.peers[e].peer.participantCardError = 0
          }
        } else {
          this.connection.peers[e].peer.participantCardError = 0
        }
      })

      if (!this.participants.has(this.connection.userid)) {
        if (!this.connection.selfCardError) {
          this.connection.selfCardError = 0
        }
        this.connection.selfCardError += 1
        if (this.connection.selfCardError > 6) {
          RTCUtils.createFakeStream(this.connection, this.connection.multiPeersHandler, this.connection.onstream)
          this.connection.selfCardError = 0
        }
      } else {
        this.connection.selfCardError = 0
      }
    }, 2000)
  }
}
