import Vue from 'vue'
import App from './App.vue'
import router from './router'
import './registerServiceWorker'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faUserSecret } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import store from './services/store'

Vue.config.productionTip = false
// Initialize FontAwesome
library.add(faUserSecret)
Vue.component('font-awesome-icon', FontAwesomeIcon)
// Install BootstrapVue
Vue.use(BootstrapVue)
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin)
// Get profile from store
var profile = window.localStorage['profile']
if (profile !== undefined) {
  store.commit('changeProfile', JSON.parse(profile))
}

new Vue({
  store,
  router,
  render: h => h(App)
}).$mount('#app')
