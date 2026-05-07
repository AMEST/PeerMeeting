// Copyright 2021 Klabukov Erik.
// SPDX-License-Identifier: GPL-3.0-only

export default class PeerStats {
  timer = null
  stats = {
    bandwidth: 0,
    stunOrTurn: { local: '', remote: '' },
    ips: { local: '', remote: '' },
    transport: { local: '', remote: '' },
    data: { send: 0, receive: 0 },
    packets: { send: 0, receive: 0 },
    codecs: { local: '', remote: '' },
    connectionState: '',
    rtt: 0.0,
  }
  old = {
    data: { send: 0, receive: 0 },
    timestamp: 0,
  }
  isFirefox = false

  constructor(peerConnection) {
    this.peerConnection = peerConnection
    this.old.timestamp = new Date().getTime()
    this.isFirefox = navigator.userAgent.indexOf('Firefox') !== -1
  }

  start(callback, interval) {
    if (!callback) throw 'Callback cannot be null'
    interval = interval || 5000
    this.timer = setInterval(() => {
      this.peerConnection.getStats().then((report) => {
        try {
          this.parseReport(report)
          callback(this.stats)
        } catch (e) {
          console.error(e)
        }
      })
    }, interval)
  }

  stop() {
    if (!this.timer) return
    clearInterval(this.timer)
  }

  parseReport(report) {
    this.stats.connectionState = this.isFirefox
      ? this.peerConnection.iceConnectionState
      : this.peerConnection.connectionState

    report.forEach((r) => {
      if (r.type !== 'transport' && !(this.isFirefox && r.type === 'candidate-pair' && r.nominated)) {
        return
      }

      const perSecond = Math.max((r.timestamp - this.old.timestamp) / 1000, 1)
      this.old.timestamp = r.timestamp

      this.stats.data.send = r.bytesSent
      this.stats.data.receive = r.bytesReceived
      this.stats.bandwidth =
        (r.bytesSent - this.old.data.send + (r.bytesReceived - this.old.data.receive)) / perSecond
      this.old.data.send = r.bytesSent
      this.old.data.receive = r.bytesReceived
      this.stats.packets.send = r.packetsSent
      this.stats.packets.receive = r.packetsReceived

      const candidatePair = this.isFirefox ? r : report.get(r.selectedCandidatePairId)
      this.stats.rtt = this.isFirefox
        ? 0
        : (candidatePair.totalRoundTripTime / candidatePair.responsesReceived).toFixed(5)

      const localCandidate = report.get(candidatePair.localCandidateId)
      this.stats.ips.local =
        (this.isFirefox ? localCandidate.address : localCandidate.ip) + ':' + localCandidate.port
      this.stats.transport.local = localCandidate.protocol
      this.stats.stunOrTurn.local =
        localCandidate.candidateType.indexOf('relay') === -1 ? 'STUN' : 'TURN'

      const remoteCandidate = report.get(candidatePair.remoteCandidateId)
      this.stats.ips.remote =
        (this.isFirefox ? remoteCandidate.address : remoteCandidate.ip) +
        ':' +
        remoteCandidate.port
      this.stats.transport.remote = remoteCandidate.protocol
      this.stats.stunOrTurn.remote =
        remoteCandidate.candidateType.indexOf('relay') === -1 ? 'STUN' : 'TURN'
    })
  }
}
