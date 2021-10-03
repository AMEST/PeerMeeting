<template>
  <b-card
    bg-variant="light"
    title="Write your name for participation in conference."
    class="login-card"
  >
    <b-card-text>
      <b-form-input
        v-model="username"
        placeholder="Enter your name"
        @keyup.enter="applyUserName"
      ></b-form-input>
    </b-card-text>
    <br>
    <b-button @click="applyUserName" variant="primary" size="lg">Continue</b-button>
  </b-card>
</template>

<script>
export default {
  name: "LogIn",
  data: () => {
    return {
      username: null,
      md5: require("md5"),
    };
  },
  methods: {
    applyUserName: function () {
      if (!this.username || this.username.length < 2) return;
      var defaultEmail = this.md5(this.username + "@example.com");
      var profile = {
        avatar: "https://www.gravatar.com/avatar/" + defaultEmail + "?s=256&d=identicon",
        name: this.username,
      };
      this.$store.commit("changeProfile", profile);
    },
  },
};
</script>

<style>
.login-card{
  margin-top: 3em;
  margin-left: auto;
  margin-right: auto;
  width: 460px;
  height: 340px;
}
.login-card .card-body{
  margin: 5.25rem 2.25rem 2.25rem 2.25rem;
}
</style>