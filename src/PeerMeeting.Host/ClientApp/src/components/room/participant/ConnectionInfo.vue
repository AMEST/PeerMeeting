<template>
  <div>
    <b-button
      class="connection-info"
      variant="outline-light"
      size="sm"
      @click="$bvToast.show('toast-' + userId)"
    >
      <b-icon icon="bar-chart-fill" />
    </b-button>
    <b-toast
      :id="'toast-' + this.userId"
      class="connection-toast"
      title="Connection Info"
      variant="secondary"
      static
      no-auto-hide
    >
      Bandwidth: {{ this.bytesToSize(this.stats.bandwidth) }}<br />
      State: {{ this.stats.connectionState }}<br />
      Local ({{this.stats.stunOrTurn.local}}): {{ this.stats.ips.local }} {{ this.stats.transport.local }}<br />
      Remote ({{this.stats.stunOrTurn.remote}}): {{ this.stats.ips.remote }} {{ this.stats.transport.remote
      }}<br />
      Data transfered: {{ this.bytesToSize(this.stats.data.receive) }}
      <b-icon icon="arrow-down-up" />
      {{ this.bytesToSize(this.stats.data.send) }} <br />
      RTT: {{ this.stats.rtt }} s.
    </b-toast>
  </div>
</template>

<script>
import CommonUtils from "@/CommonUtils";
export default {
  name: "ConnectionInfo",
  props: {
    userId: String,
    stats: Object,
  },
  methods: {
    bytesToSize: CommonUtils.bytesToSize,
  },
};
</script>

<style>
.connection-info {
  position: absolute;
  left: 1em;
  top: 1.8em;
  z-index: 40;
  border-style: hidden;
}
.connection-toast {
  z-index: 41;
  top: 3.4em;
  left: 1em;
  position: absolute;
  text-align: left;
}
</style>