// Copyright 2021 Klabukov Erik.
// SPDX-License-Identifier: GPL-3.0-only

import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const STORAGE_KEYS = {
  profile: 'profile',
  deviceSettings: 'deviceSettings',
  turnOnly: 'turnOnly',
  theme: 'theme',
  roomHistory: 'roomHistory',
  lang: 'lang',
}

const storage = {
  get(key) {
    const value = window.localStorage[key]
    return value !== undefined ? JSON.parse(value) : null
  },
  set(key, value) {
    window.localStorage[key] = JSON.stringify(value)
  },
  remove(key) {
    window.localStorage.removeItem(key)
  },
}

export default new Vuex.Store({
  state: {
    application: {
      profile: null,
      deviceSettings: {
        audioInput: null,
        videoInput: null,
      },
      turnSettings: null,
      turnOnly: false,
      chat: {
        hasNewMessages: false,
      },
      roomHistory: [],
      mediaDevices: [],
      inputDeviceChangedCallbacks: [],
      theme: '',
      version: '',
    },
  },
  getters: {
    profile: (state) => state.application.profile,
    deviceSettings: (state) => state.application.deviceSettings,
    turnSettings: (state) => state.application.turnSettings,
    turnOnly: (state) => state.application.turnOnly,
    theme: (state) => state.application.theme,
    roomHistory: (state) => state.application.roomHistory,
    mediaDevices: (state) => state.application.mediaDevices,
    hasNewMessages: (state) => state.application.chat.hasNewMessages,
    version: (state) => state.application.version,
    inputDeviceChangedCallbacks: (state) => state.application.inputDeviceChangedCallbacks,
    sortedRoomHistory: (state) =>
      [...state.application.roomHistory].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
  },
  mutations: {
    changeProfile(state, payload) {
      storage.set(STORAGE_KEYS.profile, payload)
      state.application.profile = payload
    },
    changeDeviceSettings(state, payload) {
      storage.set(STORAGE_KEYS.deviceSettings, payload)
      state.application.deviceSettings = payload
    },
    changeHasNewMessages(state, payload) {
      state.application.chat.hasNewMessages = payload
    },
    changeTurnOnly(state, payload) {
      storage.set(STORAGE_KEYS.turnOnly, payload)
      state.application.turnOnly = payload
    },
    changeTheme(state, payload) {
      storage.set(STORAGE_KEYS.theme, payload)
      state.application.theme = payload
    },
    clearProfile(state) {
      state.application.profile = null
      storage.remove(STORAGE_KEYS.profile)
    },
    addRoomToHistory(state, payload) {
      if (state.application.roomHistory.length > 10) {
        state.application.roomHistory = state.application.roomHistory.slice(-10)
      }
      state.application.roomHistory.push(payload)
      storage.set(STORAGE_KEYS.roomHistory, state.application.roomHistory)
    },
    updateRoomHistory(state, payload) {
      const existRoom = state.application.roomHistory.find((e) => e.id === payload.id)
      if (!existRoom) return
      existRoom.date = payload.date
      storage.set(STORAGE_KEYS.roomHistory, state.application.roomHistory)
    },
    clearHistory(state) {
      state.application.roomHistory = []
      storage.remove(STORAGE_KEYS.roomHistory)
    },
    updateMediaDevices(state, payload) {
      state.application.mediaDevices = payload
    },
    updateTurnSettings(state, payload) {
      state.application.turnSettings = payload
    },
    addDeviceChangedCallback(state, payload) {
      state.application.inputDeviceChangedCallbacks.push(payload)
    },
    clearDeviceChangedCallbacks(state) {
      state.application.inputDeviceChangedCallbacks = []
    },
    changeVersion(state, value) {
      state.application.version = value
    },
  },
  actions: {
    restoreState({ commit }) {
      const profile = storage.get(STORAGE_KEYS.profile)
      if (profile) commit('changeProfile', profile)

      const deviceSettings = storage.get(STORAGE_KEYS.deviceSettings)
      if (deviceSettings) commit('changeDeviceSettings', deviceSettings)

      const roomHistory = storage.get(STORAGE_KEYS.roomHistory)
      if (roomHistory) {
        roomHistory.forEach((element) => commit('addRoomToHistory', element))
      }

      const turnOnly = storage.get(STORAGE_KEYS.turnOnly)
      if (turnOnly !== null) commit('changeTurnOnly', turnOnly)

      const theme = storage.get(STORAGE_KEYS.theme)
      if (theme) {
        commit('changeTheme', theme)
      } else {
        const detectedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'default'
        commit('changeTheme', detectedTheme)
      }
    },
    notifyInputDeviceChanged({ state }) {
      state.application.inputDeviceChangedCallbacks.forEach((callback) => callback())
    },
  },
})
