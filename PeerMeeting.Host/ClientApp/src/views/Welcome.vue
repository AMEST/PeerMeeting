<template>
  <div class="Welcome">
    <b-container>
      <b-input-group
        class="mb-3"
        prepend="Room name"
      >
        <b-form-input v-model="this.roomName"></b-form-input>
        <b-input-group-append>
          <b-button size="sm" text="Button" variant="success">Go to room</b-button>
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
  created: function(){
    this.roomName = uuidv4()
  }
};
</script>
<style>
.Welcome {
  font-family: Source Sans Pro, sans-serif;
}
</style>