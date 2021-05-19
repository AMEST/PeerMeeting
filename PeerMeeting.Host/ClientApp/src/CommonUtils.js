/* eslint-disable */
var CommonUtils = {
    getInitials: function (fullName) {
        if (!fullName) return "";
        var splited = fullName.split(" ");
        if (splited.length > 1) return splited[0][0] + splited[1][0];
        return splited[0][0];
    },
    addToHistory: function(store, room){
      var existRoom = store.state.application.roomHistory.find(
        (e, i, a) => e.id == room.id
      );
      if (existRoom) {
        store.commit("updateRoomHistory", room);
        return;
      }
      store.commit("addRoomToHistory", room);
    }
}
export default CommonUtils
