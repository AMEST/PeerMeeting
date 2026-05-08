// Copyright 2021 Klabukov Erik.
// SPDX-License-Identifier: GPL-3.0-only

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
import 'vue-simple-markdown/dist/vue-simple-markdown.css'
import * as Sentry from '@sentry/vue'
import { Integrations } from '@sentry/tracing'
import axios from 'axios'
import VueI18n from 'vue-i18n'

Vue.config.productionTip = false

library.add(faUserSecret, faGithub, faVolumeUp)
Vue.component('font-awesome-icon', FontAwesomeIcon)
Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
Vue.use(VueSimpleMarkdown)
Vue.use(VueI18n)

store.dispatch('restoreState')

const themeHelper = new ThemeHelper()
Vue.prototype.$themeHelper = themeHelper
const themeHelperInitTask = themeHelper.init().then(() => {
  themeHelper.theme = store.state.application.theme
})

navigator.getUserMedia =
  navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia

if (document.cookie.indexOf('CSRF-TOKEN') > -1) {
  const v = document.cookie.match('(^|;) ?' + 'CSRF-TOKEN' + '=([^;]*)(;|$)')
  const csrfToken = v ? v[2] : ''
  axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken
}

const sentryIntegrationTask = axios.get('/api/settings').then((response) => {
  if (response.data == null || response.status !== 200) return
  Sentry.init({
    Vue,
    dsn: response.data.sentryDsn,
    integrations: [
      new Integrations.BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
        tracingOrigins: ['localhost', 'peer-meetings.nb-47.su', document.location.host, /^\//],
      }),
    ],
    tracesSampleRate: 0.5,
  })
})

let currentLang = window.localStorage['lang']
if (currentLang === undefined || (currentLang !== 'ru' && currentLang !== 'en')) {
  const browserLang = navigator.language || navigator.userLanguage
  currentLang = browserLang === 'ru-RU' ? 'ru' : 'en'
  window.localStorage['lang'] = currentLang
}

const messages = {
  en: language['en'],
  ru: language['ru'],
}
const i18n = new VueI18n({
  locale: currentLang,
  messages,
})

Promise.all([themeHelperInitTask, sentryIntegrationTask]).then(() => {
  new Vue({
    i18n,
    store,
    router,
    render: (h) => h(App),
  }).$mount('#app')
})
