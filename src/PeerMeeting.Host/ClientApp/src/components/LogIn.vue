<template>
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
</template>

<script>
export default {
  name: "LogIn",
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
};
</script>

<style>
</style>