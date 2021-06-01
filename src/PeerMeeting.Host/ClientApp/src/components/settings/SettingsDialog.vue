<template>
  <b-modal id="settings-modal" size="lg" centered title="Settings">
    <b-tabs content-class="mt-3">
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
      <b-tab title="Devices">
        <b-alert show variant="warning">Any changes to this section require a page reload.</b-alert>
        <b-form-group
          description="Audio input device"
          label="Audio input"
        >
          <b-form-select
            v-model="audioInput"
            :options="audioDevices"
          ></b-form-select>
        </b-form-group>
        <b-form-group
          description="Video input device"
          label="Video input"
        >
          <b-form-select
            v-model="videoInput"
            :options="videoDevices"
          ></b-form-select>
        </b-form-group>
        <b-button
          variant="outline-secondary"
          class="save-button"
          @click="SaveDevices"
          >Save</b-button
        >
      </b-tab>
    </b-tabs>
  </b-modal>
</template>

<script>
export default {
  name: "SettingsDialog",
  data: () => {
    return {
      username: "",
      email: "",
      audioInput: null,
      videoInput: null,
      audioDevices: [],
      videoDevices: [],
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
    SaveDevices: function () {
      var deviceSettings = this.$store.state.application.deviceSettings;
      if (this.audioInput) deviceSettings.audioInput = this.audioInput;
      if (this.videoInput) deviceSettings.videoInput = this.videoInput;

      this.$store.commit("changeDeviceSettings", deviceSettings);
      this.$bvToast.toast("Devices saved. Need page reload", {
        title: `Settings notification`,
        variant: "warning",
        solid: true,
        autoHideDelay: 90000,
        href: window.location.href
      });
    },
    FetchDevices: function () {
      this.audioDevices = Array.from(
        this.$store.state.application.mediaDevices.filter(
          (x) => x.kind === "audioinput"
        ),
        (x) => {
          return { value: x.deviceId, text: x.label ? x.label : x.deviceId };
        }
      );
      this.videoDevices = Array.from(
        this.$store.state.application.mediaDevices.filter(
          (x) => x.kind === "videoinput"
        ),
        (x) => {
          return { value: x.deviceId, text: x.label ? x.label : x.deviceId };
        }
      );
      this.$forceUpdate();
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
    },
    // eslint-disable-next-line
    "$store.state.application.deviceSettings": function (to, from) {
      this.audioInput = this.$store.state.application.deviceSettings.audioInput;
      this.videoInput = this.$store.state.application.deviceSettings.videoInput;
    },
    // eslint-disable-next-line
    "$store.state.application.mediaDevices": function (to, from) {
      this.FetchDevices();
    },
  },
  mounted: function () {
    this.username = this.$store.state.application.profile
      ? this.$store.state.application.profile.name
      : "";
    this.email = this.$store.state.application.profile
      ? this.$store.state.application.profile.email
      : "";
    this.FetchDevices();
  },
  created: function () {
    this.audioInput = this.$store.state.application.deviceSettings.audioInput;
    this.videoInput = this.$store.state.application.deviceSettings.videoInput;
    this.FetchDevices();
  },
};
</script>

<style>
.save-button {
  margin-left: auto;
  display: block !important;
}
.modal-footer {
  display: none !important;
}
</style>