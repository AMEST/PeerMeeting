<template>
  <b-tab :title="$t('settings.connection.title')">
    <b-form-group
      :description="$t('settings.connection.turnOnly.description')"
      :label="$t('settings.connection.turnOnly.label')"
    >
      <b-form-checkbox
        v-model="turnOnly"
        switch
      ></b-form-checkbox>
    </b-form-group>
    <b-button
      variant="outline-secondary"
      class="save-button"
      @click="saveSettings"
    >{{ $t('settings.connection.save') }}</b-button>
  </b-tab>
</template>

<script>
export default {
  name: 'ConnectionTab',
  data: () => ({
    turnOnly: false,
  }),
  methods: {
    saveSettings() {
      this.$store.commit('changeTurnOnly', this.turnOnly)
      this.$bvToast.toast('Connection settings saved', {
        title: `Settings notification`,
        variant: 'success',
        solid: true,
      })
    },
  },
  watch: {
    '$store.state.application.turnOnly'() {
      this.turnOnly = this.$store.state.application.turnOnly
    },
  },
  created() {
    this.turnOnly = this.$store.state.application.turnOnly
  },
}
</script>