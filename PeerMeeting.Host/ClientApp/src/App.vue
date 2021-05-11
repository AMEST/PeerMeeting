<template>
  <div id="app">
    <TopMenu />
    <router-view v-if="this.$store.state.application.profile != null" />
    <b-container v-else>
      <b-card bg-variant="dark" text-variant="white" title="Who are you?">
        <b-card-text>
          <b-form-input v-model="username" placeholder="Enter your name"></b-form-input>
        </b-card-text>
        <b-button @click="applyUserName" variant="primary">Ok</b-button>
      </b-card>
    </b-container>
  </div>
</template>

<script>
import TopMenu from "@/components/TopMenu.vue";
export default {
  components: {
    TopMenu,
  },
  data:()=>{
    return {
      username: null
    }
  },
  methods:{
    applyUserName: function(){
      var profile = {
        avatar : null,
        name : this.username,
      }
      this.$store.commit("changeProfile", profile);
    }
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
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
</style>
