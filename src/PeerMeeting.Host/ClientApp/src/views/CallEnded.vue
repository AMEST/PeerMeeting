<template>
  <b-container fluid class="container-center">
    <b-card :title="$t('callEnded.title')" class="card-center">
      <b-card-text> {{ $t("callEnded.message") }} </b-card-text>
      <b-button :to="'/'" variant="primary">{{ $t("callEnded.button") }}</b-button>
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