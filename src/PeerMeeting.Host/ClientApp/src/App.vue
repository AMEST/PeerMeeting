<template>
  <div id="app">
    <top-menu />
    <router-view v-if="this.$store.state.application.profile != null" />
    <b-container v-else>
      <log-in/>
    </b-container>
    <a class="fork-me" href="https://github.com/AMEST/PeerMeeting"
      >Fork me on
      <font-awesome-icon :icon="{ prefix: 'fab', iconName: 'github' }"/>
    </a>
    <settings-dialog/>
  </div>
</template>

<script>
import TopMenu from "@/components/TopMenu.vue";
import SettingsDialog from "@/components/settings/SettingsDialog.vue";
import LogIn from "@/components/LogIn.vue";
export default {
  components: {
    TopMenu,
    SettingsDialog,
    LogIn
  },
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
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
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
  color: black;
  background-color: rgba(0, 0, 0, 0.15);
  width: 140px;
  border-radius: 0px 10px 0px 0px;
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
