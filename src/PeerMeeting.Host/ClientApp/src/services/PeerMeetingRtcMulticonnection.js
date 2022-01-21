/* eslint-disable */
import WebRtcSignalR from "@/WebRtcHub";
import RTCUtils from "@/RTCUtils";
import RTCMultiConnection from "rtcmulticonnection";
import { v4 as uuidv4 } from "uuid";

export default class PeerMeetingRtcMulticonnection {
    detectRTC = require("detectrtc");
    connection = null;
    userid = null;
    patrticipantsFixTimer = null;
    patrticipantsCardFixTimer = null;

    constructor(store, router, participants) {
        this.store = store;
        this.router = router;
        this.participants = participants;
        this.connection = new RTCMultiConnection();
        this._generateUserId();
        this._configureExtraData();
        // using signalR for signaling
        this.connection.setCustomSocketHandler(WebRtcSignalR);
        this.configureMediaConstraints();
        this.connection.codecs.video = 'VP8';
        this.connection.session = {
            audio: true,
            video: true
        };
        this.connection.sdpConstraints.mandatory = {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true
        };
        this._configureIceServers();
        this._configureKicked();
        this._configureMute();
        this._configureVoiceDetection();
        this._startParticipantFixTimer();
    }

    join(roomId){
        this.connection.join(roomId);
    }

    leave(){
        this.connection.leave();
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

    configureMediaError(callback){
        RTCUtils.ConfigureMediaError(
            this.connection,
            this.detectRTC, 
            this.store.state.application.deviceSettings,
            callback);
    }

    configureMediaConstraints(){
        this.connection.mediaConstraints = {
          audio: this.store.state.application.deviceSettings.audioInput 
            ? { deviceId: this.store.state.application.deviceSettings.audioInput }
            : true,
          video: this.store.state.application.deviceSettings.videoInput 
            ? { deviceId: this.store.state.application.deviceSettings.videoInput }
            : true
        };
      }

    _generateUserId() {
        this.connection.userid = uuidv4() + "|" + this.store.state.application.profile.name;
        this.userid = this.connection.userid;
    }

    _configureExtraData() {
        this.connection.extra = {
            profile: this.store.state.application.profile,
            audioMuted: false,
            videoMuted: false,
            speacking: false
        };
    }

    _configureIceServers() {
        if(this.store.state.application.turnSettings != null){
            if(this.store.state.application.turnOnly){
              this.connection.iceServers = [];
              this.connection.candidates.host = false;
              this.connection.iceTransportPolicy = 'relay';
            }
            this.connection.iceServers.push({
                urls: this.store.state.application.turnSettings.uris[0],
                credential: this.store.state.application.turnSettings.password,
                username: this.store.state.application.turnSettings.username
            });
        }
    }

    _configureKicked(){
        var self = this;
        this.connection.onKicked = function(){
            self.router.push(window.location.pathname + '/ended');
        }
    }

    _configureMute(){
        var self = this;
        // overriding the event to replace the poster XD
        this.connection.onmute = function(e) {
            if (!e || !e.mediaElement) return
            if (e.muteType === 'both' || e.muteType === 'video') {
                e.mediaElement.hidden = true
            } else if (e.muteType === 'audio') {
                e.mediaElement.muted = true;
            }
        };
    
        // Overriding the event for fix mute local media element after unmute on all
        var originalOnUnmute = this.connection.onunmute
        this.connection.onunmute = function(e){
            originalOnUnmute(e)
            if(!e || !e.mediaElement) return
            if(e.userid == self.connection.userid)
            e.mediaElement.muted = true
            if(e.mediaElement.tagName == "VIDEO" && e.unmuteType == 'video')
            e.mediaElement.hidden = false
        }
    }

    _configureVoiceDetection(){
        var self = this;
        this.connection.onspeaking = function(e){
            self.connection.extra.speacking = true
            self.connection.updateExtraData()
        }
        
        this.connection.onsilence = function(e) {
            self.connection.extra.speacking = false
            self.connection.updateExtraData()
        }
    }

    _startParticipantFixTimer() {
        var self = this;
        if (this.patrticipantsFixTimer != null)
            clearInterval(this.patrticipantsFixTimer);
        // Fix for clear participant cards who disconnected without event
        this.patrticipantsFixTimer = setInterval(() => {
            var connectedParticipants = self.connection.getAllParticipants()
            for (const key of self.participants.keys()) {
                if ( (connectedParticipants.indexOf(key) == -1 && self.connection.userid != key)
                    || (self.connection.peers[key] && self.connection.peers[key].peer.connectionState === "failed")){
                        self.connection.onstreamended({ userid: key })
                    }
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
                        self.connection.peers[e].peer.participantCardError = 0
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
            if (!self.participants.has(self.connection.userid)) {
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