<template>
  <b-modal id="settings-modal" size="lg" centered :title="$t('settings.title')">
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