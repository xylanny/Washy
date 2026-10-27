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
        v-if="userStore.message"
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

/** 登录 / 注册成功后回到来源页（由路由守卫带过来），默认进面板 */
const redirectTarget = computed(() => {
  const redirect = props.query?.redirect;

  return typeof redirect === "string" && redirect.startsWith("/")
    ? redirect
    : "/dashboard";
});

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

async function getCode() {
  const email = registerForm.value.userEmail;

  if (!email) {
    userStore.message = "请先填写邮箱";
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    userStore.message = "请输入正确的邮箱格式";
    return;
  }

  userStore.message = "";

  // 只有真的发出去了才倒计时，发信失败（如 SMTP 异常）会留在按钮上让用户重试
  if (await userStore.getEmailCode(email)) {
    startCountdown();
  }
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
  userStore.message = "";
  clearCountdown();
}

function cancel() {
  showed.value = false;
  router.replace("/");
}

async function auth() {
  userStore.message = "";

  let success = false;

  if (mode.value === "login") {
    if (!isLoginValid()) {
      userStore.message = "请填写邮箱和密码";
      return;
    }

    success = await userStore.login(loginForm.value);
  } else {
    if (!isRegisterValid()) {
      userStore.message = "请填写完整的注册信息";
      return;
    }

    success = await userStore.register(registerForm.value);
  }

  // 失败就留在当前页，错误显示在上方提示条里
  if (!success) return;

  reset();
  await router.replace(redirectTarget.value);
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
