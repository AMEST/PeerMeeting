/* eslint-disable */
import WebRtcSignalR from "@/WebRtcHub";
import RTCUtils from "@/RTCUtils";
import RTCMultiConnection from "rtcmulticonnection";
import CommonUtils from "@/CommonUtils";
import { v4 as uuidv4 } from "uuid";

class PeerMeetingRtcMulticonnection {
    connection = null;
    patrticipantsFixTimer = null;
    patrticipantsCardFixTimer = null;

    constructor(store, participants) {
        this.store = store;
        this.participants = participants;
        this.connection = new RTCMultiConnection();
        this.generateUserId();
        this.configureExtraData();
        // using signalR for signaling
        this.connection.setCustomSocketHandler(WebRtcSignalR);
        this.connection.codecs.video = 'VP8';
        this.connection.session = {
            audio: true,
            video: true
        };
        connection.sdpConstraints.mandatory = {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true
        };
        this.configureMute();
        this.configureVoiceDetection();
        this.startParticipantFixTimer();
    }

    generateUserId() {
        this.connection.userid = uuidv4() + "|" + store.state.application.profile.name;
    }

    configureExtraData() {
        this.connection.extra = {
            profile: this.store.state.application.profile,
            audioMuted: false,
            videoMuted: false,
            speacking: false
        };
    }

    setOnStream(callback) {
        this.connection.onstream = callback;
    }

    setOnUserStatusChanged(callback) {
        this.connection.onUserStatusChanged = callback;
    }

    setOnMuteForcibly(callback) {
        this.connection.onMuteForcibly = callback;
    }

    setOnStreamEnded(callback) {
        // Custom on stream ended event
        this.connection.onstreamended = function (event) {
            callback(event)
            var mediaElement = document.getElementById(event.streamid)
            if (mediaElement) {
                mediaElement.parentNode.removeChild(mediaElement)
            }
        }
    }

    configureMute(){
        // overriding the event to replace the poster XD
        connection.onmute = function(e) {
            if (!e || !e.mediaElement) return
            if (e.muteType === 'both' || e.muteType === 'video') {
                e.mediaElement.hidden = true
            } else if (e.muteType === 'audio') {
                e.mediaElement.muted = true;
            }
        };
    
        // Overriding the event for fix mute local media element after unmute on all
        var originalOnUnmute = connection.onunmute
        connection.onunmute = function(e){
            originalOnUnmute(e)
            if(!e || !e.mediaElement) return
            if(e.userid == connection.userid)
            e.mediaElement.muted = true
            if(e.mediaElement.tagName == "VIDEO" && e.unmuteType == 'video')
            e.mediaElement.hidden = false
        }
    }

    configureVoiceDetection(){
        connection.onspeaking = function(e){
            connection.extra.speacking = true
            connection.updateExtraData()
        }
        
        connection.onsilence = function(e) {
            connection.extra.speacking = false
            connection.updateExtraData()
        }
    }

    startParticipantFixTimer() {
        var self = this;
        if (this.patrticipantsFixTimer != null)
            clearInterval(this.patrticipantsFixTimer);
        // Fix for clear participant cards who disconnected without event
        this.patrticipantsFixTimer = setInterval(() => {
            var connectedParticipants = self.connection.getAllParticipants()
            for (const key of self.participants.keys()) {
                if (connectedParticipants.indexOf(key) == -1
                    && self.connection.userid != key
                    || (self.connection.peers[key]
                        && self.connection.peers[key].peer.connectionState === "failed"))
                        self.connection.onstreamended({ userid: key })
            }
        }, 5000)

        if (this.patrticipantsCardFixTimer != null)
            clearInterval(this.patrticipantsCardFixTimer);

        // Fix peer connections without cards
        this.patrticipantsCardFixTimer = setInterval(() => {
            self.connection.peers.getAllParticipants().forEach(e => {
                if (!self.participants.has(e)
                    && self.connection.peers[e]
                    && self.connection.peers[e].peer
                    && self.connection.peers[e].peer.connectionState
                    && self.connection.peers[e].peer.connectionState === "connected") {

                    if (!self.connection.peers[e].peer.participantCardError)
                        self.self.connection.peers[e].peer.participantCardError = 0
                    self.connection.peers[e].peer.participantCardError += 1

                    if (self.connection.peers[e].peer.participantCardError > 6) {
                        self.connection.onstream({
                            streamid: null,
                            userid: e,
                            extra: self.connection.peers[e].extra,
                            cardfix: true,
                            mediaElement: document.createElement("div"),
                        })
                        self.connection.peers[e].peer.participantCardError = 0
                    }
                } else {
                    self.connection.peers[e].peer.participantCardError = 0
                }
            })
            if (!self.participants.has(connection.userid)) {
                if (!self.connection.selfCardError)
                    self.connection.selfCardError = 0

                self.connection.selfCardError += 1
                if (self.connection.selfCardError > 6) {
                    RTCUtils.CreateFakeStream(self.connection, self.connection.multiPeersHandler, self.connection.onstream)
                    self.connection.selfCardError = 0
                }
            } else {
                self.connection.selfCardError = 0
            }
        }, 2000)
    }
}