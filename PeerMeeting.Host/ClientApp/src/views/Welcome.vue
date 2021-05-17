<template>
  <div class="Welcome">
    <b-container class="full-height work-shadow">
      <br>
      <b-jumbotron>
        <template #header>PeerMeeting</template>

        <template #lead>
          Start & join meetings for free. No account needed, open service, write you name and open or join room!
        </template>

        <hr class="my-4" />

        <b-input-group prepend="Room name">
          <b-form-input
            v-model="roomName"
            @keyup.enter="goToRoom(roomName)"
          ></b-form-input>
          <b-input-group-append>
            <b-button
              size="sm"
              text="Button"
              variant="success"
              @click="goToRoom(roomName)"
              >Start meeting</b-button
            >
          </b-input-group-append>
        </b-input-group>
      </b-jumbotron>

      <b-list-group class="history">
        <b-list-group-item
          button
          v-for="item in getHistory()"
          v-bind:key="item.id"
          @click="goToRoom(item.id)"
        >
          <span>{{ new Date(item.date).toLocaleString() }} </span>
          <h4>{{ item.id }}</h4>
        </b-list-group-item>
      </b-list-group>
    </b-container>
  </div>
</template>

<script>
import { v4 as uuidv4 } from "uuid";
export default {
  name: "Welcome",
  components: {},
  data: () => {
    return {
      roomName: "",
    };
  },
  methods: {
    goToRoom: function (id = undefined) {
      if (id == undefined) window.location.href = "/" + this.roomName;
      else window.location.href = "/" + id;
    },
    getHistory: function () {
      return this.$store.state.application.roomHistory
        .slice()
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    },
  },
  created: function () {
    this.roomName = uuidv4();
  },
};
</script>
<style>
.Welcome {
  font-family: Source Sans Pro, sans-serif;
}
.Welcome .jumbotron{
  padding: 2rem 1rem !important;
}
.full-height {
  min-height: calc(100vh - 63px);
}
.work-shadow {
  box-shadow: inset 0 0.5rem 1rem rgba(0, 0, 0, 0.35) !important;
}
.history {
  text-align: left;
}
.history span {
  width: 30%;
}
.history h4 {
  width: 70%;
  display: inline;
  padding-left: 1em;
}
</style>