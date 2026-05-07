<template>
  <b-tab :title="$t('settings.devices.title')">
    <b-alert show variant="warning">{{
      $t("settings.devices.warning")
    }}</b-alert>
    <b-form-group
      :description="$t('settings.devices.audio.description')"
      :label="$t('settings.devices.audio.label')"
    >
      <b-form-select
        v-model="audioInput"
        :options="audioDevices"
      ></b-form-select>
    </b-form-group>
    <b-form-group
      :description="$t('settings.devices.video.description')"
      :label="$t('settings.devices.video.label')"
    >
      <b-form-select
        v-model="videoInput"
        :options="videoDevices"
      ></b-form-select>
    </b-form-group>
    <div class="save-button" style="width: 250px">
      <b-button class="mr-1" variant="outline-warning" @click="reload"
        >{{$t('settings.devices.reload')}}</b-button
      >
      <b-button variant="outline-secondary" @click="saveDevices">{{$t('settings.devices.save')}}</b-button>
    </div>
  </b-tab>
</template>

<script>
export default {
  name: "DevicesTab",
  data: () => ({
    audioInput: null,
    videoInput: null,
    audioDevices: [],
    videoDevices: [],
  }),
  methods: {
    reload() {
      this.$store.dispatch('notifyInputDeviceChanged')
      this.$bvToast.toast("Reinitialization input devices.", {
        title: `Settings notification`,
        variant: "warning",
        solid: true,
      })
    },
    saveDevices() {
      const deviceSettings = { ...this.$store.state.application.deviceSettings }
      if (this.audioInput) deviceSettings.audioInput = this.audioInput
      if (this.videoInput) deviceSettings.videoInput = this.videoInput
      this.$store.dispatch('notifyInputDeviceChanged')
      this.$store.commit("changeDeviceSettings", deviceSettings)
      this.$bvToast.toast("Devices saved.", {
        title: `Settings notification`,
        variant: "success",
        solid: true,
      })
    },
    fetchDevices() {
      this.audioDevices = Array.from(
        this.$store.state.application.mediaDevices.filter(
          (x) => x.kind === "audioinput"
        ),
        (x) => ({ value: x.deviceId, text: x.label ? x.label : x.deviceId })
      )
      this.videoDevices = Array.from(
        this.$store.state.application.mediaDevices.filter(
          (x) => x.kind === "videoinput"
        ),
        (x) => ({ value: x.deviceId, text: x.label ? x.label : x.deviceId })
      )
    },
  },
  watch: {
    "$store.state.application.deviceSettings"() {
      this.audioInput = this.$store.state.application.deviceSettings.audioInput
      this.videoInput = this.$store.state.application.deviceSettings.videoInput
    },
    "$store.state.application.mediaDevices"() {
      this.fetchDevices()
    },
  },
  mounted() {
    this.fetchDevices()
  },
  created() {
    this.audioInput = this.$store.state.application.deviceSettings.audioInput
    this.videoInput = this.$store.state.application.deviceSettings.videoInput
    this.fetchDevices()
  },
}
</script>
