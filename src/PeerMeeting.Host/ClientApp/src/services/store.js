import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    application: {
      profile: null,
      roomHistory: [],
      mediaDevices: [],
      version: ''
    }
  },
  getters: {},
  mutations: {
    changeProfile (state, payload) {
      window.localStorage['profile'] = JSON.stringify(payload)
      state.application.profile = payload
    },
    // eslint-disable-next-line
    clearProfile (state) {
      state.application.profile = null
      window.localStorage.removeItem('profile')
    },
    addRoomToHistory (state, payload) {
      if (state.application.roomHistory.length > 10) {
        var sliceAt = state.application.roomHistory.length - 10
        state.application.roomHistory = state.application.roomHistory.slice(sliceAt, state.application.roomHistory.length)
      }
      state.application.roomHistory.push(payload)
      window.localStorage['roomHistory'] = JSON.stringify(state.application.roomHistory)
    },
    updateRoomHistory (state, payload) {
      // eslint-disable-next-line
      var existRoom = state.application.roomHistory.find((e, i, a) => e.id === payload.id)
      if (!existRoom) {
        return
      }
      existRoom.date = payload.date
      window.localStorage['roomHistory'] = JSON.stringify(state.application.roomHistory)
    },
    // eslint-disable-next-line
    clearHistory (state, payload) {
      state.application.roomHistory = []
      window.localStorage.removeItem('roomHistory')
    },
    updateMediaDevices (state, payload) {
      state.application.mediaDevices = payload
    },
    changeVersion (state, value) {
      state.application.version = value
    }
  },
  actions: {}
})
