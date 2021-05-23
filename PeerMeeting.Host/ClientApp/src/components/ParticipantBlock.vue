<template>
  <div
    class="card text-white user-block"
    :class="[this.fullscreen ? 'pseudo-fullscreen' : '', this.halfscreen ? 'half-screen' : '']"
    :id="'card-' + this.streamEvent.userid"
  >
    <span class="username-span">
      {{ this.streamEvent.userid.split("|")[1] }}</span
    >
    <b-avatar> {{ this.getInitials() }}</b-avatar>
    <b-button class="fullscreen-button" size="sm" variant="outline-secondary" @click="switchFullscreen">
      <b-icon
        v-if="!this.fullscreen"
        icon="fullscreen"
      />
      <b-icon v-else icon="fullscreen-exit"/>
    </b-button>
    <div class="switch-half-screen" @click="switchHalfScreen"></div>
  </div>
</template>

<script>
import CommonUtils from "@/CommonUtils";
export default {
  name: "ParticipantBlock",
  data: () => {
    return {
      fullscreen: false,
      halfscreen: false,
    };
  },
  props: {
    streamEvent: Object,
    state: Object,
    DetectRTC: Object,
    participants: Map  
  },
  methods: {
    switchFullscreen: function () {
      this.fullscreen = !this.fullscreen;
    },
    switchHalfScreen: function(){
      if(this.participants.size <= 1) return;
      if(this.DetectRTC.isMobileDevice) return;
      if(this.state.halfScreenMode && !this.halfscreen) return;
      this.state.halfScreenMode = !this.state.halfScreenMode;
      this.halfscreen = !this.halfscreen;
    },
    getInitials: function () {
      return CommonUtils.getInitials(this.streamEvent.userid.split("|")[1]);
    },
    clearMediaElements: function () {
      var card = document.getElementById("card-" + this.streamEvent.userid);
      for (const el of card.getElementsByTagName("video"))
        el.parentNode.removeChild(el);
      for (const el of card.getElementsByTagName("audio"))
        el.parentNode.removeChild(el);
    },
  },
  watch: {
    streamEvent: function (newVal, oldVal) {
      // watch it
      // eslint-disable-next-line
      console.log("Prop changed: ", newVal, " | was: ", oldVal);
      this.clearMediaElements();
      var card = document.getElementById("card-" + this.streamEvent.userid);
      if (newVal.mediaElement != null) {
        newVal.mediaElement.controls = false;
        if (newVal.type == "local") newVal.mediaElement.muted = true;
      }
      card.appendChild(newVal.mediaElement);
      setTimeout(() => {
        newVal.mediaElement.play();
        if (newVal.type == "local")
          newVal.mediaElement.muted = true;
      }, 500);
    },
  },
  mounted: function () {
    var self = this;
    var card = document.getElementById("card-" + this.streamEvent.userid);
    if (this.streamEvent.mediaElement != null) {
      this.streamEvent.mediaElement.controls = false;
      if (this.streamEvent.type == "local")
        this.streamEvent.mediaElement.muted = true;
    }
    card.appendChild(this.streamEvent.mediaElement);
    setTimeout(() => {
      self.streamEvent.mediaElement.play();
      if (self.streamEvent.type == "local")
        self.streamEvent.mediaElement.muted = true;
    }, 500);
  },
  destroyed: function(){
    if(!this.halfscreen) return;
    this.state.halfScreenMode = false;
  }
};
</script>

<style>
.user-block {
  min-width: 355px;
  overflow: hidden;
  border-radius: 18px;
  border-style: hidden;
  max-height: calc(100vh - 169px);
  background-color: black;
  min-height: 240px;
}
.user-block video {
  background-color: transparent;
  height: 100%;
  z-index: 1;
}
.user-block .b-avatar {
  position: absolute;
  z-index: 0;
  left: calc(50% - 100px);
  bottom: calc(50% - 100px);
  width: 200px;
  height: 200px;
  font-size: 4em;
}
.username-span {
  position: absolute;
  background-color: rgb(255, 255, 255, 0.32);
  width: 100%;
  overflow: hidden;
  overflow-wrap: normal;
  color: black;
  font-weight: bold;
  z-index: 2;
}
.pseudo-fullscreen {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100% !important;
  min-height: calc( 100% - 48px);
  max-height: calc( 100% - 48px);
  padding: 0px!important;
  margin: 0px!important;
  border-radius: 0px;
}
.fullscreen-button {
  position: absolute;
  bottom: 1em;
  right: 1em;
  z-index: 40;
  color: white;
  border-style: hidden;
}
.fullscreen-button .b-icon{
  padding-top: 1px;
}
.switch-half-screen{
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 39;
  background-color: transparent;
  cursor: pointer;
}
.half-screen{
  position: fixed;
  width: calc( 100% - 285px);
  height: 100%;
  z-index: -1;
  padding: 0px;
  left: 0;
  margin: 0px 0px 0px 1.5em;
}
</style>