<template>
  <div id="app">
    <top-menu />
    <router-view v-if="this.$store.state.application.profile != null && this.loaded" />
    <b-container class="login-container" v-else>
      <log-in v-if="this.loaded" />
    </b-container>
    <a 
    :class="[this.$route.name == 'room'? 'hide-forkme' : '']"
    class="fork-me" 
    href="https://github.com/AMEST/PeerMeeting"
    >
      Fork me
      <font-awesome-icon :icon="{ prefix: 'fab', iconName: 'github' }"/>
    </a>
    <span class="text-muted text-version">{{this.$store.state.application.version}}</span>
    <settings-dialog/>
  </div>
</template>

<script>
import axios from 'axios'
import TopMenu from "@/components/TopMenu.vue";
import SettingsDialog from "@/components/settings/SettingsDialog.vue";
import LogIn from "@/components/LogIn.vue";
import { v4 as uuidv4 } from "uuid";
export default {
  components: {
    TopMenu,
    SettingsDialog,
    LogIn
  },
  data: () => ({
    loaded: false,
  }),
  mounted: function () {
    var self = this;
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      // eslint-disable-next-line
      console.log("enumerateDevices() не поддерживается.");
      return;
    }
    navigator.mediaDevices.enumerateDevices().then(function (devices) {
      self.$store.commit("updateMediaDevices", devices);
    });
  },
  created: async function(){
    var versionRequest = await axios.get("/api/version");
    if(versionRequest.data != null){
      this.$store.commit("changeVersion", versionRequest.data.version);
    }
    var username = this.$store.state.application.profile != null ? this.$store.state.application.profile.name : uuidv4();
    var turnRequest = await axios.post("/api/credentials","username="+username);
    if (turnRequest.data != null && turnRequest.status != 204){
      this.$store.commit("updateTurnSettings", turnRequest.data);
    }
    
    this.loaded = true;
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  overflow-x: hidden;
  height: 100vh;
}
#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
.fork-me {
  position: fixed;
  z-index: 29;
  left: 0;
  bottom: 0;
  color: #888;
  background-color: rgba(0, 0, 0, 0.15);
  max-width: 270px;
  padding-left: 5px;
  padding-right: 5px;
  border-radius: 0px 10px 0px 0px;
}

.text-version{
  position: fixed;
  right: 5px;
  bottom: 0;
  z-index: -1;
}

.login-container{
  height: calc(100vh - 58px);
  align-items: baseline;
  display: flex;
}

.hide-forkme{
  display: none!important;;
}

/* Scroll */
/* width */
::-webkit-scrollbar {
  width: 10px;
}
/* Track */
::-webkit-scrollbar-track {
  background: transparent;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #888;
}
/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
