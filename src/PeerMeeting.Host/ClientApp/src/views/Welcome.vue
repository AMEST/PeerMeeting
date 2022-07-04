<template>
  <div class="Welcome">
    <b-container fluid class="container-center">
      <b-container>
        <b-jumbotron>
          <template #header>Peer Meeting</template>

          <template #lead>
            {{ $t("welcome.message") }}
          </template>

          <hr class="my-4" />
          <b-tabs>
            <b-tab active>
              <template #title>
                <span class="tab-title">{{ $t("welcome.new") }}</span>
              </template>
              <b-input-group>
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
                    >{{ $t("welcome.startMeeting") }}</b-button
                  >
                </b-input-group-append>
              </b-input-group>
            </b-tab>

            <b-tab>
              <template #title>
                <span class="tab-title">{{ $t("welcome.recent") }}</span>
              </template>
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
            </b-tab>
          </b-tabs>
        </b-jumbotron>
      </b-container>
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
.Welcome .jumbotron {
  padding: 2rem 1rem !important;
  background-color: inherit;
}
.full-height {
  min-height: calc(100vh - 63px);
}
.work-shadow {
  box-shadow: inset 0 0.5rem 1rem rgba(0, 0, 0, 0.35) !important;
}
.Welcome .nav-link {
  padding-right: 0.5em !important;
}
.Welcome .nav-link.active {
  border: unset !important;
}
.Welcome .nav-link:hover {
  border-color: transparent !important;
}
.Welcome .nav-tabs{
  border-bottom:unset!important; 
  padding-bottom: 1em;
}
.Welcome hr{
  border-top: 1px solid var(--welcome-hr, #444);
}
.tab-title {
  font-size: 22px;
  margin-left: 4px;
  line-height: 30px;
  font-weight: 400;
  font-family: "Open Sans", Arial, Helvetica, Tahoma sans-serif;
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