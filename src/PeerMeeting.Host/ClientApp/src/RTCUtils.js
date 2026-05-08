// Copyright 2021 Klabukov Erik.
// SPDX-License-Identifier: GPL-3.0-only

const RTCUtils = {
  configureMediaError(connection, detectRTC, deviceSettings, onMediaStateChange) {
    connection.onMediaError = (e) => {
      const mPeer = connection.multiPeersHandler
      console.error('Media Error', e.message)

      if (
        e.message === 'Requested device not found' ||
        e.message === 'The object can not be found here.' ||
        e.message === 'The request is not allowed by the user agent or the platform in the current context.'
      ) {
        connection.dontCaptureUserMedia = true
        onMediaStateChange(false, false)
        if (connection.getAllParticipants().length <= 0) {
          connection.join(connection.sessionid)
        } else {
          connection.renegotiate()
        }
        return
      }

      if (e.message === 'Concurrent mic process limit.') {
        if (detectRTC.audioInputDevices.length <= 1) {
          alert('Please select external microphone. Check github issue number 483.')
          return
        }
        const secondaryMic = detectRTC.audioInputDevices[1].deviceId
        connection.mediaConstraints.audio = { deviceId: secondaryMic }
        if (connection.getAllParticipants().length <= 0) {
          connection.join(connection.sessionid)
        } else {
          connection.renegotiate()
        }
        return
      }

      onMediaStateChange(false, true)
      connection.dontCaptureUserMedia = true
      const audioDevice = deviceSettings.audioInput
        ? { deviceId: deviceSettings.audioInput }
        : true
      navigator.getUserMedia(
        { audio: audioDevice, video: false },
        (stream) => {
          connection.addStream(stream)
          mPeer.onGettingLocalMedia(stream)
          if (connection.getAllParticipants().length <= 0) {
            connection.join(connection.sessionid)
          } else {
            connection.renegotiate()
          }
        },
        () => {}
      )
    }
  },

  async addBaseStream(connection, mediaState, deviceSettings) {
    connection.attachStreams.forEach((s) => s.stop())
    connection.attachStreams = []

    if (!mediaState.hasMicrophone && !mediaState.hasWebcam) {
      return this.createFakeStream(connection)
    }

    if (mediaState.hasMicrophone && !mediaState.hasWebcam && connection.dontCaptureUserMedia) {
      const audioDevice = deviceSettings.audioInput
        ? { deviceId: deviceSettings.audioInput }
        : true
      return new Promise((resolve, reject) => {
        navigator.getUserMedia(
          { audio: audioDevice, video: false },
          (stream) => resolve(this.addStream(connection, stream)),
          (e) => reject(e)
        )
      })
    }

    return new Promise((resolve, reject) => {
      navigator.getUserMedia(
        connection.mediaConstraints,
        (stream) => resolve(this.addStream(connection, stream)),
        (e) => reject(e)
      )
    })
  },

  addStream(connection, stream) {
    return new Promise((resolve) => {
      connection.attachStreams.forEach((s) => s.stop())
      connection.attachStreams = []
      setTimeout(() => {
        connection.addStream(stream)
        connection.multiPeersHandler.onGettingLocalMedia(stream)
        this.setHarkHandler(connection, stream)
        resolve(this.createVideoElementEvent(connection.userid, stream))
      }, 300)
    })
  },

  createFakeStream(connection) {
    connection.attachStreams = []
    const emptyStream = new MediaStream()
    connection.addStream(emptyStream)
    connection.multiPeersHandler.onGettingLocalMedia(emptyStream)
    return this.createVideoElementEvent(connection.userid, emptyStream)
  },

  createVideoElementEvent(userid, stream) {
    const video = document.createElement('video')
    video.srcObject = stream
    video.id = stream.id
    video.autoplay = true
    video.playsInline = true
    video.muted = true
    return {
      userid,
      streamid: stream.id,
      mediaElement: video,
    }
  },

  setHarkHandler(connection, stream) {
    if (!stream || stream.getAudioTracks().length < 1) return
    if (!connection.onspeaking || !connection.onsilence) return
    if (typeof hark === 'undefined') {
      throw 'hark.js not found.'
    }

    const speechEvent = {
      userid: connection.userid,
      stream,
    }
    // eslint-disable-next-line
    const speech = hark(stream, {})

    speech.on('speaking', () => connection.onspeaking(speechEvent))
    speech.on('stopped_speaking', () => connection.onsilence(speechEvent))
  },
}

export default RTCUtils
