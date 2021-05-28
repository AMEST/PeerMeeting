<template>
  <div id="app">
    <TopMenu />
    <router-view v-if="this.$store.state.application.profile != null" />
    <b-container v-else>
      <b-card
        bg-variant="secondary"
        text-variant="white"
        title="Who are you?"
        style="margin-top: 3em"
      >
        <b-card-text>
          <b-form-input
            v-model="username"
            placeholder="Enter your name"
            @keyup.enter="applyUserName"
          ></b-form-input>
        </b-card-text>
        <b-button @click="applyUserName" variant="primary">Ok</b-button>
      </b-card>
    </b-container>
    <a class="fork-me" href="https://github.com/AMEST/PeerMeeting"
      >Fork me on
      <font-awesome-icon :icon="{ prefix: 'fab', iconName: 'github' }"
    /></a>
    <settings/>
  </div>
</template>

<script>
import TopMenu from "@/components/TopMenu.vue";
import Settings from "@/components/Settings.vue";
export default {
  components: {
    TopMenu,
    Settings
  },
  data: () => {
    return {
      username: null,
    };
  },
  methods: {
    applyUserName: function () {
      if (!this.username || this.username.length < 2) return;

      var profile = {
        avatar: null,
        name: this.username,
      };
      this.$store.commit("changeProfile", profile);
    },
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
