<template>
  <b-tab title="Profile" active>
    <b-form-group
      description="User name displayed to all participants in room"
      label="Enter username:"
      label-for="input-1"
    >
      <b-form-input
        v-model="username"
        trim
        @keyup.enter="SaveProfile"
      ></b-form-input>
    </b-form-group>
    <b-form-group
      description="Gravatar email identificator, for display you avatar to participants"
      label="Enter gravatar email:"
      label-for="input-1"
    >
      <b-form-input
        v-model="email"
        trim
        @keyup.enter="SaveProfile"
      ></b-form-input>
    </b-form-group>
    <b-button
      variant="outline-secondary"
      class="save-button"
      @click="SaveProfile"
      >Save</b-button
    >
  </b-tab>
</template>

<script>
export default {
  name: "ProfileTab",
  data: () => {
    return {
      username: "",
      email: "",
      md5: require("md5"),
    };
  },
  methods: {
    SaveProfile: function () {
      if (!this.username || this.username.length < 2) return;
      var profile = {
        avatar: null,
        name: this.username,
        email: this.email,
      };

      if (this.email && this.email.length > 0) {
        var emailHash = this.md5(this.email);
        profile.avatar =
          "https://www.gravatar.com/avatar/" + emailHash + "?s=256&d=identicon";
      } else {
        profile.avatar = null;
      }
      this.$store.commit("changeProfile", profile);
      this.$bvToast.toast("Profile saved", {
        title: `Settings notification`,
        variant: "success",
        solid: true,
      });
    },
  },
  watch: {
    // eslint-disable-next-line
    "$store.state.application.profile": function (to, from) {
      this.username = this.$store.state.application.profile
        ? this.$store.state.application.profile.name
        : "";
      this.email = this.$store.state.application.profile
        ? this.$store.state.application.profile.email
        : "";
    }
  },
  mounted: function () {
    this.username = this.$store.state.application.profile
      ? this.$store.state.application.profile.name
      : "";
    this.email = this.$store.state.application.profile
      ? this.$store.state.application.profile.email
      : "";
  }
};
</script>

<style>
</style>