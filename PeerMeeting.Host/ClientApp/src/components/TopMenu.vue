<template>
  <div>
    <b-navbar toggleable="sm" class="shadow p-0">
      <b-container fluid>
        <b-navbar-brand href="/" id="brand">
          <img class="topicon" src="../assets/logo.png" alt="rss" />PeerMeeting
        </b-navbar-brand>
        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">
          <b-nav-item-dropdown
            v-if="this.$store.state.application.profile != null"
            right
          >
            <!-- Using 'button-content' slot -->
            <template v-slot:button-content>
              <em>
                <b-avatar
                  class="white-avatar"
                  :text="getInitials()"
                  :src="$store.state.application.profile.avatar"
                ></b-avatar>
              </em>
            </template>
            <b-dropdown-text style="width: 240px">
              Signed in as
              <span class="username">{{
                $store.state.application.profile.name
              }}</span>
            </b-dropdown-text>
            <b-dropdown-divider></b-dropdown-divider>
            <b-dropdown-item @click="signOut">Sign Out</b-dropdown-item>
          </b-nav-item-dropdown>
        </b-navbar-nav>
      </b-container>
    </b-navbar>
  </div>
</template>

<script>
export default {
  name: "TopMenu",
  data: () => ({}),
  methods: {
    signOut: function () {
      this.$store.commit("clearProfile");
      this.$store.commit("clearHistory");
    },
    getInitials: function () {
      var fullName = this.$store.state.application.profile.name;
      if (!fullName) return "";
      var splited = fullName.split(" ");
      if (splited.length > 1) return splited[0][0] + splited[1][0];
      return splited[0][0];
    },
  },
};
</script>

<style>
.topicon {
  max-width: 48px;
  margin-bottom: 5px;
  padding-right: 5px;
}
.white-avatar .b-avatar-img img {
  background-color: white;
}
.username {
  font-weight: bold;
}
</style>