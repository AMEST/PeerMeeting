// Copyright 2021 Klabukov Erik.
// SPDX-License-Identifier: GPL-3.0-only

import RTCUtils from '@/RTCUtils'

export default class RTCStateService {
  rtcConnection = null
  store = null
  stateCheckTimer = null
  state = {
    chatOpened: false,
    audioEnabled: true,
    videoEnabled: true,
    screenEnabled: false,
    halfScreenMode: false,
    fullScreenMode: false,
    hasWebcam: true,
    hasMicrophone: true,
  }

  constructor(connection, store) {
    this.rtcConnection = connection
    this.store = store
    this.stateCheckTimer = setInterval(() => this.stateCheck(), 1000)
  }

  renegotiateStreams() {
    this.rtcConnection.connection.renegotiate()
  }

  leave() {
    this.rtcConnection.leave()
  }

  switchAudioMute(state = null) {
    this.state.audioEnabled = state === null ? !this.state.audioEnabled : state
    this.rtcConnection.connection.attachStreams.forEach((s) => {
      if (this.state.audioEnabled) {
        s.unmute('audio')
      } else {
        s.mute('audio')
      }
      this.rtcConnection.connection.extra.audioMuted = !this.state.audioEnabled
      this.rtcConnection.connection.updateExtraData()
    })
  }

  switchVideoMute(state = null) {
    this.state.videoEnabled = state === null ? !this.state.videoEnabled : state
    this.rtcConnection.connection.attachStreams.forEach((s) => {
      if (this.state.videoEnabled) {
        s.unmute('video')
      } else {
        s.mute('video')
      }
      this.rtcConnection.connection.extra.videoMuted = !this.state.videoEnabled
      this.rtcConnection.connection.updateExtraData()
    })
  }

  async screenSharing(onStreamAdded) {
    this.state.screenEnabled = !this.state.screenEnabled
    this.state.audioEnabled = this.state.hasMicrophone
    this.state.videoEnabled =
      this.rtcConnection.dontCaptureUserMedia && !this.state.hasWebcam
        ? false
        : !this.state.screenEnabled

    const mPeer = this.rtcConnection.connection.multiPeersHandler

    if (this.state.screenEnabled) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        })

        if (!this.state.hasMicrophone) {
          const event = await RTCUtils.addStream(
            this.rtcConnection.connection,
            screenStream,
            mPeer
          )
          onStreamAdded(event)
          return
        }

        try {
          const audioDevice = this.store.state.application.deviceSettings.audioInput
            ? { deviceId: this.store.state.application.deviceSettings.audioInput }
            : true
          const microphoneStream = await new Promise((resolve, reject) => {
            navigator.getUserMedia(
              { audio: audioDevice, video: false },
              (stream) => resolve(stream),
              (e) => reject(e)
            )
          })
          screenStream.addTrack(microphoneStream.getAudioTracks()[0])
        } catch (e) {
          console.error('screen sharing with mic error', e)
        }

        const event = await RTCUtils.addStream(
          this.rtcConnection.connection,
          screenStream,
          mPeer
        )
        onStreamAdded(event)
      } catch (e) {
        console.error('screen sharing', e)
      }
      return
    }

    this.rtcConnection.connection.attachStreams.forEach((s) => s.stop())
    this.rtcConnection.connection.attachStreams = []
    const event = await RTCUtils.addBaseStream(
      this.rtcConnection.connection,
      this.state,
      this.store.state.application.deviceSettings
    )
    onStreamAdded(event)
  }

  stateCheck() {
    this.rtcConnection.connection.attachStreams.forEach((s) => {
      if (this.state.hasMicrophone) {
        s.getAudioTracks().forEach((track) => {
          const enabled = track.enabled
          if (enabled && !this.state.audioEnabled) s.mute('audio')
          else if (!enabled && this.state.audioEnabled) s.unmute('audio')
        })
      }
      if (!this.state.screenEnabled && this.state.hasWebcam) {
        s.getVideoTracks().forEach((track) => {
          const enabled = track.enabled
          if (enabled && !this.state.videoEnabled) s.mute('video')
          else if (!enabled && this.state.videoEnabled) s.unmute('video')
        })
      }
    })
  }
}
