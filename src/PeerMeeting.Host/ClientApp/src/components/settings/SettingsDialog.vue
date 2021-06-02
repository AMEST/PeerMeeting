<template>
  <b-modal id="settings-modal" size="lg" centered title="Settings">
    <b-tabs content-class="mt-3">
      <profile-tab/>
      <devices-tab/>
    </b-tabs>
  </b-modal>
</template>

<script>
import ProfileTab from '@/components/settings/ProfileTab.vue';
import DevicesTab from '@/components/settings/DevicesTab.vue';
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
  components:{
    ProfileTab,
    DevicesTab
  }
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