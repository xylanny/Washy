<template>
  <div v-if="showed" class="auth">
    <form class="auth__form" @submit.prevent="auth">
      <div class="auth__cancel-wrap">
        <button type="button" class="auth__cancel-btn" @click="cancel">
          &times;
        </button>
      </div>

      <h2 class="auth__title">{{ title }}</h2>

      <el-alert
        v-if="userStore.message && mode === 'login'"
        :title="userStore.message"
        type="error"
        closable
        @close="userStore.message = ''"
      />

      <template v-if="mode === 'login'">
        <label class="auth__field" v-for="(_, key) in loginForm" :key="key">
          <input
            v-model="loginForm[key]"
            :type="
              ['userPassword', 'checkedPassword'].includes(key)
                ? 'password'
                : 'text'
            "
            :class="{ active: loginForm[key] }"
            required
          />
          <span>{{ formatHint(key) }}</span>
        </label>
      </template>

      <template v-else>
        <label class="auth__field" v-for="(_, key) in computedRegisterForm">
          <input
            v-model="registerForm[key]"
            :type="
              ['userPassword', 'checkedPassword'].includes(key)
                ? 'password'
                : 'text'
            "
            :class="{ active: registerForm[key] }"
            required
          />
          <span>{{ formatHint(key) }}</span>
        </label>

        <label class="auth__code-wrap">
          <input
            v-model="registerForm.emailCode"
            type="text"
            placeholder="Email Code"
            class="auth__code-input"
          />
          <button
            type="button"
            class="auth__code-btn"
            :disabled="time > 0"
            @click="getCode"
          >
            {{ time > 0 ? `${time}s` : "GET" }}
          </button>
        </label>
      </template>

      <div class="auth__actions">
        <button type="button" class="auth__btn" @click="reset">Reset</button>
        <button type="submit" class="auth__btn">{{ title }}</button>
      </div>

      <div class="auth__change-wrap">
        <span>{{
          mode === "login" ? "Don't have an account?" : "Have an account?"
        }}</span>
        <span class="auth__change-link" @click="toggleMode">{{
          mode === "login" ? "Sign up" : "Sign in"
        }}</span>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import type { AuthMode, LoginForm, RegisterForm } from "./types";

const props = defineProps(["query"]);

const userStore = useUserStore();
const router = useRouter();

const showed = ref(true);
const mode = ref<AuthMode>(
  props.query?.mode === "register" ? "register" : "login",
);
const title = computed(() => (mode.value === "login" ? "Login" : "Register"));

const loginForm = ref<LoginForm>({
  userEmail: "",
  userPassword: "",
});

const registerForm = ref<RegisterForm>({
  userName: "",
  userEmail: "",
  userPassword: "",
  checkedPassword: "",
  emailCode: "",
});

const computedRegisterForm = computed(() => {
  const { emailCode, ...rest } = registerForm.value;
  return rest;
});

const time = ref(0);
let timer: number | null = null;

function getCode() {
  if (!registerForm.value.userEmail) return;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(registerForm.value.userEmail)) {
    alert("请输入正确的邮箱格式");
    return;
  }

  try {
    userStore.getEmailCode(registerForm.value.userEmail);
    startCountdown();
  } catch (error) {}
}

function startCountdown() {
  time.value = 60;
  if (timer) {
    window.clearInterval(timer);
    timer = null;
  }

  timer = window.setInterval(() => {
    time.value--;
    if (time.value <= 0 && timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }, 1000);
}

function clearCountdown() {
  if (timer) {
    window.clearInterval(timer);
    timer = null;
  }
  time.value = 0;
}

function reset() {
  loginForm.value = { userEmail: "", userPassword: "" };
  registerForm.value = {
    userName: "",
    userEmail: "",
    userPassword: "",
    checkedPassword: "",
    emailCode: "",
  };
}

function toggleMode() {
  mode.value = mode.value === "login" ? "register" : "login";
  clearCountdown();
}

function cancel() {
  showed.value = false;
  router.replace("/");
}

async function auth() {
  if (mode.value === "login") {
    if (isLoginValid()) {
      await userStore.login(loginForm.value);
    } else {
      userStore.message = "缺少必要的字段信息";
      return;
    }
  } else if (mode.value === "register") {
    if (isRegisterValid()) {
      await userStore.register(registerForm.value);
    } else {
      userStore.message = "缺少必要的字段信息";
    }
  }

  // 跳转到面板
  router.replace("/dashboard");
}

function formatHint(str: string) {
  let s = str;
  if (str.toLowerCase().startsWith("user")) {
    s = str.slice(4);
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function isLoginValid(): boolean {
  return !!(loginForm.value.userEmail && loginForm.value.userPassword);
}

function isRegisterValid(): boolean {
  return !!(
    registerForm.value.userName &&
    registerForm.value.userEmail &&
    registerForm.value.emailCode &&
    registerForm.value.userPassword &&
    registerForm.value.checkedPassword
  );
}
</script>

<style scoped lang="scss" src="./style.scss"></style>
