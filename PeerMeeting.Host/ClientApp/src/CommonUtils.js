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
    },
    getUserNameFromEvent: function(event){
      try{
        if(event.extra && event.extra.profile && event.extra.profile.name)
          return event.extra.profile.name
        return event.userid.split("|")[1]
      }catch(e){
        return event.userid
      }
    },
    getAvatarFromEvent: function(event){
      try{
        if(event.extra && event.extra.profile && event.extra.profile.avatar)
          return event.extra.profile.avatar
      }catch(e){}
      return null;
    }
}
export default CommonUtils
