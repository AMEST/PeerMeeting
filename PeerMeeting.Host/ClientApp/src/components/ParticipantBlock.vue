<template>
  <div
    class="card text-white user-block"
    :id="'card-' + this.streamEvent.userid"
  >
    <span class="username-span">
      {{ this.streamEvent.userid.split("|")[1] }}</span
    >
    <b-avatar> {{ this.getInitials() }}</b-avatar>
  </div>
</template>

<script>
import CommonUtils from "@/CommonUtils";
export default {
  name: "ParticipantBlock",
  props: {
    streamEvent: Object,
  },
  methods: {
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
        newVal.mediaElement.muted = true;
      }, 500);
    },
  },
  mounted: function () {
    var self = this
    var card = document.getElementById("card-" + this.streamEvent.userid);
    if (this.streamEvent.mediaElement != null) {
      this.streamEvent.mediaElement.controls = false;
      if (this.streamEvent.type == "local")
        this.streamEvent.mediaElement.muted = true;
    }
    card.appendChild(this.streamEvent.mediaElement);
    setTimeout(() => {
      self.streamEvent.mediaElement.play();
      self.streamEvent.mediaElement.muted = true;
    }, 500);
  },
};
</script>

<style>
.user-block {
  min-width: 355px;
  overflow: hidden;
  border-radius: 18px;
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
</style>