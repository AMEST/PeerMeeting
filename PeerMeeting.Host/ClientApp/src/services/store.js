import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    application: {
      profile: null,
      version: ''
    }
  },
  getters: {},
  mutations: {
    changeProfile (state, payload) {
      window.localStorage['profile'] = JSON.stringify(payload)
      state.application.profile = payload
    },
    changeVersion (state, value) {
      state.application.version = value
    }
  },
  actions: {}
})
