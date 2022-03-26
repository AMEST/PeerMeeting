// Copyright 2021 Klabukov Erik.
// SPDX-License-Identifier: GPL-3.0-only
/*eslint-disable*/
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import './registerServiceWorker'
import language from './assets/lang.json'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faUserSecret, faVolumeUp } from '@fortawesome/free-solid-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import store from './services/store'
import ThemeHelper from './services/ThemeHelper'
import VueSimpleMarkdown from 'vue-simple-markdown'
// You need a specific loader for CSS files like https://github.com/webpack/css-loader
import 'vue-simple-markdown/dist/vue-simple-markdown.css'
// Sentry
import * as Sentry from "@sentry/vue";
import { Integrations } from "@sentry/tracing";
import axios from 'axios'
// i18n
import VueI18n from 'vue-i18n'

Vue.config.productionTip = false
// Initialize FontAwesome
library.add(faUserSecret, faGithub, faVolumeUp)
Vue.component('font-awesome-icon', FontAwesomeIcon)
// Install BootstrapVue
Vue.use(BootstrapVue)
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin)
// Markdown plugin
Vue.use(VueSimpleMarkdown)
// i18n plugin
Vue.use(VueI18n)

// Get profile from store
var profile = window.localStorage['profile']
if (profile !== undefined) {
  store.commit('changeProfile', JSON.parse(profile))
}
// Restore device settings
var deviceSettings = window.localStorage['deviceSettings']
if (deviceSettings !== undefined) {
  store.commit('changeDeviceSettings', JSON.parse(deviceSettings))
}
// Restore room settings
var roomHistory = window.localStorage['roomHistory']
if (roomHistory !== undefined) {
  var parsedHistory = JSON.parse(roomHistory)
  parsedHistory.forEach(element => {
    store.commit('addRoomToHistory', element)
  })
}
// Restore turn only settings
var turnOnly = window.localStorage['turnOnly']
if (turnOnly !== undefined) {
  store.commit('changeTurnOnly', JSON.parse(turnOnly))
}
// Restore theme settings
var themeHelper = new ThemeHelper()
Vue.prototype.$themeHelper = themeHelper
themeHelper.init().then(r => {
  var theme = window.localStorage['theme']
  if (theme !== undefined) {
    store.commit('changeTheme', theme)
  }else{
    var detectedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "default"
    store.commit('changeTheme', detectedTheme)
  }
  themeHelper.theme = store.state.application.theme
})

// Restore language settings
var currentLang = window.localStorage['lang']
if (currentLang === undefined || currentLang !== "ru" && currentLang !== "en" ) {
  var browserLang = navigator.language || navigator.userLanguage;
  currentLang = browserLang === "ru-RU" ? "ru" : "en";
  window.localStorage['lang'] = currentLang;
}
console.log(language);
const messages =   {
  en: language["en"],
  ru: language["ru"],
}
const i18n = new VueI18n({
  locale: currentLang, // set locale
  messages, // set locale messages
})

// Detect getUserMedia
navigator.getUserMedia = navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia

// Apply csrf
if (document.cookie.indexOf('CSRF-TOKEN') > -1) {
  const v = document.cookie.match('(^|;) ?' + 'CSRF-TOKEN' + '=([^;]*)(;|$)')
  const r = v ? v[2] : ''
  var csrfToken = r
  axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken
}

// Add Sentry exception handling
axios.get("/api/settings").then(response => {
  if(response.data == null || response.status != 200)
    return;
  Sentry.init({
    Vue,
    dsn: response.data.sentryDsn,
    integrations: [
      new Integrations.BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
        tracingOrigins: ["localhost", "peer-meetings.nb-47-dev.tk", document.location.host, /^\//],
      }),
    ],
    tracesSampleRate: 0.5,
  });
})

new Vue({
  i18n,
  store,
  router,
  render: h => h(App)
}).$mount('#app')
