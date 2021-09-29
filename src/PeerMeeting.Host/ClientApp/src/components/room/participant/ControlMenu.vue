<template>
  <b-dropdown
    dropleft
    variant="outline-light"
    class="control-menu"
    size="sm"
  >
    <template v-slot:button-content>
      <em>
          <b-icon icon="three-dots-vertical"/>
      </em>
    </template>
    <b-dropdown-item @click="this.muteParticipant">Mute</b-dropdown-item>
    <b-dropdown-item @click="this.muteAllParticipants">Mute All</b-dropdown-item>
    <b-dropdown-item @click="this.kickPatricipant">Kick</b-dropdown-item>
  </b-dropdown>
</template>

<script>
export default {
    name: "ControlMenu",
    props: {    
        userId: String,
        connection: Object
    },
    methods:{
        muteParticipant: function(){
            this.connection.connection.socket.emit('mute-participant', {
                remoteUserId: this.userId,
                sender: this.connection.connection.userid
            });
        },
        muteAllParticipants: function(){
            this.connection.connection.socket.emit('mute-participant', {
                remoteUserId: this.userId,
                sender: this.connection.connection.userid,
                all: true
            });
        },
        kickPatricipant: function(){
            this.connection.connection.socket.emit('kick-participant', {
                remoteUserId: this.userId,
                sender: this.connection.connection.userid
            });
        },
    }
};
</script>

<style>
.control-menu {
  z-index: 41;
  top: 1.5em;
  right: 1em;
  position: absolute;
  text-align: left;
}
.control-menu ul{
    transform: translate3d(-162px, 0px, 0px)!important;
}
.control-menu .dropdown-toggle{
    border: none;
}
.control-menu .dropdown-toggle::before{
    content: none;
}
</style>