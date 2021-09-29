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
    <b-dropdown-form>
        <b-form-input type="range" min="0" max="100" v-model="volume">a</b-form-input>
    </b-dropdown-form>
    <b-dropdown-divider></b-dropdown-divider>
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
    data: () => ({
        volume: 100,
        player: null
    }),
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
        getPlayer: function(){
            this.player = document.getElementById(this.connection.connection.peers[this.userId].streams[0].streamid);
            if(this.player == null){
                setTimeout(this.getPlayer, 100);
                return;
            }
            this.volume = this.player.volume * 100;
        },
    },
    watch:{
        volume: function(n,o){
            if(!this.player || n == o)
                return;
            this.player.volume = n / 100;
        }
    },
    mounted: function(){
        if(!this.connection.connection.peers[this.userId].streams[0])
            return;
        this.getPlayer();
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