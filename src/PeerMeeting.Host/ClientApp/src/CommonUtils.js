// Copyright 2021 Klabukov Erik.
// SPDX-License-Identifier: GPL-3.0-only

const CommonUtils = {
  getInitials(fullName) {
    if (!fullName) return ''
    const parts = fullName.split(' ')
    if (parts.length > 1) return parts[0][0] + parts[1][0]
    return parts[0][0]
  },

  addToHistory(store, room) {
    const existRoom = store.state.application.roomHistory.find((e) => e.id === room.id)
    if (existRoom) {
      store.commit('updateRoomHistory', room)
      return
    }
    store.commit('addRoomToHistory', room)
  },

  getUserNameFromEvent(event) {
    try {
      if (event.extra && event.extra.profile && event.extra.profile.name) {
        return event.extra.profile.name
      }
      return event.userid.split('|')[1]
    } catch (e) {
      return event.userid
    }
  },

  getAvatarFromEvent(event) {
    try {
      if (event.extra && event.extra.profile && event.extra.profile.avatar) {
        return event.extra.profile.avatar
      }
    } catch (e) {
      // ignore
    }
    return null
  },

  bytesToSize(bytes) {
    const k = 1000
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes <= 0) return '0 Bytes'
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10)
    if (!sizes[i]) return '0 Bytes'
    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i]
  },

  extractExtraData(connection, userid) {
    const extra = connection.userid === userid
      ? connection.extra
      : connection.getExtraData(userid)
    if (!extra.audioMuted) extra.audioMuted = false
    if (!extra.videoMuted) extra.videoMuted = false
    return extra
  },
}

export default CommonUtils
