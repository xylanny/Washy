<template>
  <div class="home">
    <header class="home__heading">
      <RouterLink class="home__brand" to="/">
        <span class="home__brand-mark">
          <svg viewBox="0 0 1024 1024" aria-hidden="true">
            <path :d="HAND_PATH" />
          </svg>
        </span>
        <span>Washy</span>
      </RouterLink>

      <!-- 版本号来自 system store（读取 package.json 的 version） -->
      <span class="home__version">v{{ systemStore.version }}</span>
    </header>

    <main class="home__hero">
      <section
        class="home__hero-stage"
        :class="{ 'home__hero-stage--animating': isAnimating }"
        @mouseenter="replayText"
        @click="replayText"
      >
        <div class="home__hero-copy">
          <p class="home__eyebrow">
            <span class="home__eyebrow-dot"></span> A calmer way to work with
            data
          </p>
          <h1 class="home__title">
            <span class="home__title-line">Make sense of</span>
            <span
              class="home__title-line home__title-line--accent"
              aria-label="what matters"
            >
              <span
                v-for="(letter, index) in ANIMATED_WORD"
                :key="`${letter}-${index}-${animationKey}`"
                class="home__title-letter"
                :style="{ '--letter-index': index }"
              >
                {{ letter === " " ? "\u00a0" : letter }}
              </span>
            </span>
          </h1>
          <p class="home__description">
            Washy turns scattered information into a clear, visual workspace —
            so better decisions feel simple, focused, and within reach.
          </p>
          <button
            type="button"
            class="home__button home__button--dark home__button--large"
            @click.stop="goToAuth('register')"
          >
            Start exploring <span class="home__button-icon">↗</span>
          </button>
        </div>

        <div class="home__signal" aria-hidden="true">
          <svg class="home__signal-svg" viewBox="0 0 1024 1024">
            <path :d="HAND_PATH" />
          </svg>
        </div>
        <div class="home__ring"></div>
        <div class="home__ring home__ring--inner"></div>
        <span class="home__dot"></span>
        <span class="home__caption">
          DATA IN MOTION<br /><strong class="home__caption-strong"
            >MEANING IN FOCUS</strong
          >
        </span>
      </section>
    </main>

    <footer class="home__footer">
      <span class="home__scroll">
        <i class="home__scroll-icon"></i> MOVE TO EXPLORE
      </span>
      <span class="home__footer-line"></span>
      <span class="home__footer-text"
        >EST. 2024 — BUILT FOR BETTER QUESTIONS</span
      >
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { HAND_PATH, ANIMATED_WORD } from "./constants";
import { useSystemStore } from "@/stores/system";
import { useUserStore } from "@/stores/user";

type AuthMode = "login" | "register";

const router = useRouter();
const systemStore = useSystemStore();
const animationKey = ref(0);
const isAnimating = ref(true);

function goToAuth(mode: AuthMode) {
  router.push({ name: "auth", query: { mode } });
}

function replayText() {
  isAnimating.value = false;
  requestAnimationFrame(() => {
    animationKey.value++;
    isAnimating.value = true;
  });
}

onMounted(async () => {
  const userStore = useUserStore();
  await userStore.resume();
});
</script>

<style scoped lang="scss" src="./style.scss"></style>
