// Copyright 2021 Klabukov Erik.
// SPDX-License-Identifier: GPL-3.0-only

import Vue from 'vue'
import App from './App.vue'
import router from './router'
import './registerServiceWorker'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faUserSecret, faVolumeUp } from '@fortawesome/free-solid-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import store from './services/store'
import VueSimpleMarkdown from 'vue-simple-markdown'
// You need a specific loader for CSS files like https://github.com/webpack/css-loader
import 'vue-simple-markdown/dist/vue-simple-markdown.css'
// Sentry
import * as Sentry from "@sentry/vue";
import { Integrations } from "@sentry/tracing";
import axios from 'axios'

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
  store,
  router,
  render: h => h(App)
}).$mount('#app')
