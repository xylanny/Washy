<template>
  <div class="profile-details">
    <h2 class="profile-details__title">{{ title }}</h2>

    <dl class="profile-details__list">
      <div
        v-for="item in items"
        :key="item.label"
        class="profile-details__row"
      >
        <dt class="profile-details__label">{{ item.label }}</dt>
        <dd class="profile-details__value" :title="item.value">
          {{ item.value }}
        </dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
import type { ProfileDetailsProps } from "./types";

withDefaults(defineProps<ProfileDetailsProps>(), {
  title: "Account",
});
</script>

<style scoped lang="scss" src="./style.scss"></style>
