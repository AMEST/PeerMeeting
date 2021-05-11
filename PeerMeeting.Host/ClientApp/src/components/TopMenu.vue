<template>
  <div>
    <b-navbar toggleable="sm" class="shadow p-0">
      <b-container fluid>
        <b-navbar-brand href="/" id="brand">
          <img class="topicon" src="../assets/logo.png" alt="rss" />PeerMeeting
        </b-navbar-brand>
        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">
          <b-button
            variant="outline-secondary"
            v-if="this.$store.state.application.profile == null"
            href="/api/account/login"
            right
          >SignIn</b-button>
          <b-nav-item-dropdown v-if="this.$store.state.application.profile != null" right>
            <!-- Using 'button-content' slot -->
            <template v-slot:button-content>
              <em>
                <b-avatar class="white-avatar" :src="$store.state.application.profile.avatar"></b-avatar>
                {{$store.state.application.profile.name}}
              </em>
            </template>
            <b-dropdown-item href="/api/account/SignOut">Sign Out</b-dropdown-item>
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
  methods: {}
};
</script>

<style>
.topicon {
  max-width: 48px;
  margin-bottom: 5px;
}
.white-avatar .b-avatar-img img{
  background-color: white;
}
</style>