<template>
  <b-tab :title="$t('settings.profile.title')" active>
    <b-form-group
      :description="$t('settings.profile.username.description')"
      :label="$t('settings.profile.username.label')"
      label-for="input-1"
    >
      <b-form-input
        v-model="username"
        trim
        @keyup.enter="saveProfile"
      ></b-form-input>
    </b-form-group>
    <b-form-group
      :description="$t('settings.profile.gravatar.description')"
      :label="$t('settings.profile.gravatar.label')"
      label-for="input-1"
    >
      <b-form-input
        v-model="email"
        trim
        @keyup.enter="saveProfile"
      ></b-form-input>
    </b-form-group>
    <b-form-group
      :description="$t('settings.profile.theme.description')"
      :label="$t('settings.profile.theme.label')"
    >
      <b-form-select
        v-model="currentTheme"
        :options="themes"
      ></b-form-select>
    </b-form-group>
    <b-form-group
      :description="$t('settings.profile.language.description')"
      :label="$t('settings.profile.language.label')"
    >
      <b-form-select
        v-model="$i18n.locale"
        :options="langs"
      ></b-form-select>
    </b-form-group>
    <b-button
      variant="outline-secondary"
      class="save-button"
      @click="saveProfile"
    >{{ $t('settings.profile.save') }}</b-button>
  </b-tab>
</template>

<script>
export default {
  name: 'ProfileTab',
  data: () => ({
    username: '',
    email: '',
    themes: [],
    langs: ['ru', 'en'],
    currentTheme: '',
    md5: require('md5'),
  }),
  methods: {
    saveProfile() {
      this.$store.commit('changeTheme', this.currentTheme)
      this.$themeHelper.theme = this.currentTheme

      if (!this.username || this.username.length < 2) return
      const profile = {
        avatar: null,
        name: this.username,
        email: this.email,
      }

      if (this.email && this.email.length > 0) {
        const emailHash = this.md5(this.email)
        profile.avatar =
          'https://www.gravatar.com/avatar/' + emailHash + '?s=256&d=identicon'
      } else {
        profile.avatar = null
      }
      this.$store.commit('changeProfile', profile)

      this.$bvToast.toast('Profile settings saved', {
        title: `Settings notification`,
        variant: 'success',
        solid: true,
      })
    },
  },
  watch: {
    '$store.state.application.profile'() {
      this.username = this.$store.state.application.profile
        ? this.$store.state.application.profile.name
        : ''
      this.email = this.$store.state.application.profile
        ? this.$store.state.application.profile.email
        : ''
    },
    '$store.state.application.theme'() {
      this.currentTheme = this.$store.state.application.theme
    },
    '$i18n.locale'(newValue) {
      window.localStorage['lang'] = newValue
    },
  },
  mounted() {
    this.username = this.$store.state.application.profile
      ? this.$store.state.application.profile.name
      : ''
    this.email = this.$store.state.application.profile
      ? this.$store.state.application.profile.email
      : ''
    this.currentTheme = this.$store.state.application.theme
    this.themes = this.$themeHelper.themes
  },
}
</script>
