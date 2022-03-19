// Copyright 2021 Klabukov Erik.
// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable */
import RTCUtils from "@/RTCUtils";

export default class RTCStateService {
    rtcConnection = null;
    store = null;
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
    stateCheckTimer = null;

    constructor(connection, store) {
        this.rtcConnection = connection;
        this.store = store;
        this.stateCheckTimer = setInterval(this.stateCheck, 300);
    }

    renegotiateStreams(){
        this.rtcConnection.connection.renegotiate();
    }

    leave(){
        this.rtcConnection.leave();
    }

    // Switch mute/unmute audio
    switchAudioMute(state = null) {
        var self = this;
        this.state.audioEnabled = state == null ? !this.state.audioEnabled : state;
        this.rtcConnection.connection.attachStreams.forEach(s => {
            if (self.state.audioEnabled)
                s.unmute("audio");
            else
                s.mute("audio");
            self.rtcConnection.connection.extra.audioMuted = !self.state.audioEnabled;
            self.rtcConnection.connection.updateExtraData();
        })
    }

    // Switch mute/unmute video
    switchVideoMute(state = null) {
        var self = this;
        this.state.videoEnabled =  state == null ? !this.state.videoEnabled : state;
        this.rtcConnection.connection.attachStreams.forEach(s => {
            if (self.state.videoEnabled)
                s.unmute("video")
            else
                s.mute("video")

            self.rtcConnection.connection.extra.videoMuted = !self.state.videoEnabled
            self.rtcConnection.connection.updateExtraData()
        })
    }

    // Start screen sharing or stop and back to video + audio or audio only or empty
    screenSharing(callback = e => {}) {
        this.rtcConnection.connection.attachStreams.forEach(s => s.stop())
        console.log(this.rtcConnection.connection.attachStreams)
        this.state.screenEnabled = !this.state.screenEnabled;
        this.state.audioEnabled = this.state.hasMicrophone;
        this.state.videoEnabled = this.rtcConnection.dontCaptureUserMedia && !this.state.hasWebcam
          ? false
          : !this.state.screenEnabled;
        var mPeer = this.rtcConnection.connection.multiPeersHandler
        var self = this
        if (this.state.screenEnabled) {
            //Getting screen stream with system audio
            navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                .then(function (screenStream) {
                    if (!self.state.hasMicrophone) {
                        RTCUtils.AddStream(self.rtcConnection.connection, screenStream, mPeer, callback)
                        return
                    }
                    //On succes getting microphone stream, for add to screen stream
                    var audioDevice = self.store.state.application.deviceSettings.audioInput ? { deviceId: self.store.state.application.deviceSettings.audioInput } : true
                    navigator.getUserMedia(
                        { audio: audioDevice, video: false },
                        function (microphoneStream) {
                            screenStream.addTrack(microphoneStream.getAudioTracks()[0])
                            RTCUtils.AddStream(self.rtcConnection.connection, screenStream, mPeer, callback)
                        },
                        function (e) {
                            console.error('screen sharing with mic error', e)
                            RTCUtils.AddStream(connection, screenStream, mPeer, callback)
                        })
                }, function (e) { console.error('screen sharing', e) });
            return
        }
        this.rtcConnection.connection.attachStreams = []
        RTCUtils.AddBaseStream(this.rtcConnection.connection, this.state, this.store.state.application.deviceSettings, callback)
    }

    stateCheck() {
        var self = this;
        this.rtcConnection.connection.attachStreams.forEach(s => {
            if(self.state.hasMicrophone)
                s.getAudioTracks().forEach(track =>{
                    var enabled = track.enabled;
                    if(enabled && !self.state.audioEnabled) s.mute("audio");
                    else if (!enable && self.state.audioEnabled) s.unmute("audio");
                })
            if(!self.state.screenEnabled && self.state.hasWebcam)
                s.getVideoTracks().forEach(track =>{
                    var enabled = track.enabled;
                    if(enabled && !self.state.videoEnabled) s.mute("video");
                    else if (!enable && self.state.videoEnabled) s.unmute("video");
                })
        });
    }
}