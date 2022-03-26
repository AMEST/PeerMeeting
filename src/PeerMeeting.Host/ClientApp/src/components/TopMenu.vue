<template>
  <div class="top-menu-plcae-reservation">
    <b-navbar toggleable="sm" class="shadow top-menu p-0">
      <b-container fluid>
        <b-navbar-brand href="/" id="brand" :class="[this.$route.name == 'room'? 'hide-brand-in-room-on-small-screen' : '']">
          <img class="topicon" src="../assets/logo.png" alt="rss" />PeerMeeting
        </b-navbar-brand>
        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">
          <b-form-select
            v-if="this.$store.state.application.profile == null"
            v-model="$i18n.locale"
            :options="langs"
          ></b-form-select>
          <b-nav-item-dropdown
            v-else
            right
          >
            <!-- Using 'button-content' slot -->
            <template v-slot:button-content>
              <em>
                <b-avatar
                  class="avatar-bg"
                  :text="getInitials()"
                  :src="$store.state.application.profile.avatar"
                ></b-avatar>
              </em>
            </template>
            <b-dropdown-text style="width: 240px">
              {{$t('topMenu.signedAs')}}
              <span class="username">{{
                $store.state.application.profile.name
              }}</span>
            </b-dropdown-text>
            <b-dropdown-divider></b-dropdown-divider>
            <b-dropdown-item v-b-modal.settings-modal>{{$t('topMenu.settings')}}</b-dropdown-item>
            <b-dropdown-item @click="signOut">{{$t('topMenu.signOut')}}</b-dropdown-item>
          </b-nav-item-dropdown>
        </b-navbar-nav>
      </b-container>
    </b-navbar>
  </div>
</template>

<script>
import CommonUtils from "@/CommonUtils";
export default {
  name: "TopMenu",
  data: () => ({
    langs: ["ru", "en"]
  }),
  methods: {
    signOut: function () {
      this.$store.commit("clearProfile");
      this.$store.commit("clearHistory");
    },
    getInitials: function () {
      return CommonUtils.getInitials(
        this.$store.state.application.profile.name
      );
    },
  },
  watch: {
    // eslint-disable-next-line
    "$i18n.locale": function(to,from){
      window.localStorage['lang'] = to;
    }
  },
};
</script>

<style>
.top-menu-plcae-reservation {
  width: 100%;
  min-height: 58px;
}
.top-menu {
  position: fixed !important;
  width: 100%;
  z-index: 1000;
  background-color: var(--bs-body-bg);
}
.topicon {
  max-width: 48px;
  margin-bottom: 5px;
  padding-right: 5px;
}
#brand {
  color: #ffc107!important;
}
.avatar-bg .b-avatar-img img {
  background-color: var(--bs-body-bg);
}
.username {
  font-weight: bold;
}
.navbar-nav .dropdown-menu {
  position: absolute !important;
}
@media (max-width: 801px) {
  .hide-brand-in-room-on-small-screen {
    display: none !important;
  }
}
</style>