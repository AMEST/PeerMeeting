<template>
  <div class="Welcome">
    <b-container class="full-height work-shadow">
      <b-input-group
        class="mb-3 pt-5"
        prepend="Room name"
      >
        <b-form-input v-model="this.roomName"></b-form-input>
        <b-input-group-append>
          <b-button size="sm" text="Button" variant="success" @click="goToRoom">Go to room</b-button>
        </b-input-group-append>
      </b-input-group>
    </b-container>
  </div>
</template>

<script>
import { v4 as uuidv4 } from 'uuid'
export default {
  name: "Welcome",
  components: {},
  data: () => {
    return {
      roomName: ""
    }
  },
  methods:{
    goToRoom: function(){
      window.location.href = '/'+this.roomName;
    }
  },
  created: function(){
    this.roomName = uuidv4()
  }
};
</script>
<style>
.Welcome {
  font-family: Source Sans Pro, sans-serif;
}
.full-height {
  min-height: calc(100vh - 63px);
}
.work-shadow{
  box-shadow: inset 0 .5rem 1rem rgba(0,0,0,.35)!important;
}
</style>