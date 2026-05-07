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
      :id="'toast-' + userId"
      class="connection-toast"
      title="Connection Info"
      variant="secondary"
      static
      no-auto-hide
    >
      Bandwidth: {{ bytesToSize(stats.bandwidth) }}<br />
      State: {{ stats.connectionState }}<br />
      Local ({{ stats.stunOrTurn.local }}): {{ stats.ips.local }}
      {{ stats.transport.local }}<br />
      Remote ({{ stats.stunOrTurn.remote }}): {{ stats.ips.remote }}
      {{ stats.transport.remote }}<br />
      Data transfered: {{ bytesToSize(stats.data.receive) }}
      <b-icon icon="arrow-down-up" />
      {{ bytesToSize(stats.data.send) }} <br />
      RTT: {{ stats.rtt }} s.
    </b-toast>
  </div>
</template>

<script>
import CommonUtils from '@/CommonUtils'

export default {
  name: 'ConnectionInfo',
  props: {
    userId: String,
    stats: Object,
  },
  methods: {
    bytesToSize: CommonUtils.bytesToSize,
  },
}
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
.connection-toast .toast {
  display: block !important;
}
</style>
