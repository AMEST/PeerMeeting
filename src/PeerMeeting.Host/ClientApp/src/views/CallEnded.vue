<template>
  <b-container fluid class="container-center">
    <b-card bg-variant="light" title="The call was over." class="card-center">
      <b-card-text> You have been removed from the room </b-card-text>
      <b-button :to="'/'" variant="primary">Go to Home</b-button>
    </b-card>
  </b-container>
</template>

<script>
export default {
  name: "CallEnded",
};
</script>

<style scoped>
.container-center {
  position: absolute;
  width: 100%;
  top: 40%;
  -ms-transform: translateY(-15%);
  transform: translateY(-15%);
}
.card-center {
  margin-left: auto;
  margin-right: auto;
  width: 350px;
}
</style>