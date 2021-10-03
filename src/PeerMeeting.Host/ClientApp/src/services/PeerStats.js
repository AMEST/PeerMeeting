// Copyright 2021 Klabukov Erik.
// SPDX-License-Identifier: GPL-3.0-only
/*eslint-disable*/
export default class PeerStats {
    timer = null;
    stats = {
        bandwidth: 0,
        stunOrTurn: { local: "", remote: "" },
        ips: { local: "", remote: "" },
        transport: { local: "", remote: "" },
        data: { send: 0, receive: 0 },
        packets: { send: 0, receive: 0 },
        codecs: { local: "", remote: "" },
        connectionState: "",
        rtt: 0.0,
    };
    old = {
        data: { send: 0, receive: 0 },
        timestamp: 0
    }
    isFirefox = false

    constructor(PeerConnection) {
        this.PeerConnection = PeerConnection
        this.old.timestamp = new Date().getTime();
        this.isFirefox = navigator.userAgent.indexOf("Firefox") != -1
    }

    start(callback, interval) {
        if (!callback)
            throw "Callback cannot be null";
        interval = interval || 3000;
        var self = this;
        this.timer = setInterval(() => {
            self.PeerConnection.getStats().then(r => {
                try{
                    self.parseReport(r);
                    callback(self.stats);
                }catch(e){
                    console.error(e);
                }
            });
        }, interval)
    }

    stop() {
        if (!this.timer) return;
        clearInterval(this.timer);
    }

    parseReport(report) {
        var self = this;
        this.stats.connectionState = this.isFirefox
            ? this.PeerConnection.iceConnectionState
            : this.PeerConnection.connectionState;
        report.forEach(r => {
            if (r.type == 'transport' || (self.isFirefox && r.type == 'candidate-pair' && r.nominated)) {
                var perSecond = (r.timestamp - self.old.timestamp) / 1000;
                perSecond = perSecond < 1 ? 1 : perSecond;
                self.old.timestamp = r.timestamp;

                //Bandwidth and bytes send / received
                self.stats.data.send = r.bytesSent;
                self.stats.data.receive = r.bytesReceived;
                self.stats.bandwidth = ((r.bytesSent - self.old.data.send) + (r.bytesReceived - self.old.data.receive)) / perSecond;
                self.old.data.send = r.bytesSent;
                self.old.data.receive = r.bytesReceived;
                self.stats.packets.send = r.packetsSent;
                self.stats.packets.receive = r.packetsReceived;

                //candidate pair
                var candidatePair = self.isFirefox ? r : report.get(r.selectedCandidatePairId);
                self.stats.rtt = self.isFirefox ? 0 : (candidatePair.totalRoundTripTime / candidatePair.responsesReceived).toFixed(5)

                var localCandidate = report.get(candidatePair.localCandidateId);
                self.stats.ips.local = (self.isFirefox ? localCandidate.address : localCandidate.ip) + ":" + localCandidate.port;
                self.stats.transport.local = localCandidate.protocol;
                self.stats.stunOrTurn.local =
                    localCandidate.candidateType.indexOf("relayed") !== -1
                        ? "TURN"
                        : "STUN";

                var remoteCandidate = report.get(candidatePair.remoteCandidateId);
                self.stats.ips.remote = (self.isFirefox ? remoteCandidate.address : remoteCandidate.ip) + ":" + remoteCandidate.port;
                self.stats.transport.remote = remoteCandidate.protocol;
                self.stats.stunOrTurn.remote =
                    remoteCandidate.candidateType.indexOf("relayed") !== -1
                        ? "TURN"
                        : "STUN";
                return
            }
        });
    }

}