import { userAPI } from "@/api/modules/user";
import type {
  UserLoginDTO,
  UserRegisterDTO,
  UserUpdateDTO,
  UserVO,
} from "@/api/types";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

/**
 * 登录态
 *
 * - unknown：还没尝试恢复（例如刚打开页面）
 * - authed ：已登录，user 可用
 * - anon   ：确定未登录（没有 token，或 token 已失效）
 * - error  ：有 token 但这次没取到用户信息（网络/服务异常），可以重试
 */
export type SessionState = "unknown" | "authed" | "anon" | "error";

export const useUserStore = defineStore("user", () => {
  const user = ref<UserVO | null>(null);
  const message = ref<string | null>(null);
  const state = ref<SessionState>("unknown");

  /** 并发调用 ensureSession 时复用同一个请求 */
  let pending: Promise<SessionState> | null = null;

  const isAuthed = computed(() => Boolean(user.value));

  function describe(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
  }

  /**
   * 写入登录态
   *
   * token 只在服务端返回时更新（/user/info 不会回传 token，不能覆盖掉已有的）
   */
  function applyUser(next: UserVO | null | undefined): void {
    user.value = next ?? null;

    if (next?.token) {
      localStorage.setItem("token", next.token);
    }

    state.value = next ? "authed" : "anon";
    message.value = null;
  }

  /** 登录，返回是否成功（失败原因写在 message 里） */
  async function login(params: UserLoginDTO): Promise<boolean> {
    try {
      const responseBody = await userAPI.login(params);

      if (responseBody.code !== 20000 || !responseBody.data) {
        message.value = responseBody.message || "登录失败";
        return false;
      }

      applyUser(responseBody.data);
      return true;
    } catch (error) {
      message.value = describe(error, "登录失败，请稍后重试");
      return false;
    }
  }

  /** 注册，返回是否成功（失败原因写在 message 里） */
  async function register(params: UserRegisterDTO): Promise<boolean> {
    try {
      const responseBody = await userAPI.register(params);

      if (responseBody.code !== 20000 || !responseBody.data) {
        message.value = responseBody.message || "注册失败";
        return false;
      }

      applyUser(responseBody.data);
      return true;
    } catch (error) {
      message.value = describe(error, "注册失败，请稍后重试");
      return false;
    }
  }

  /** 发送邮箱验证码，返回是否真的发出去了 */
  async function getEmailCode(email: string): Promise<boolean> {
    try {
      const responseBody = await userAPI.sendEmailCode({ userEmail: email });

      if (responseBody.code !== 20000) {
        message.value = responseBody.message || "验证码发送失败";
        return false;
      }

      message.value = null;
      return true;
    } catch (error) {
      message.value = describe(error, "验证码发送失败，请稍后重试");
      return false;
    }
  }

  /**
   * 用 localStorage 里的 token 换回用户信息
   *
   * 没有 token 只是「未登录」，不算错误，也不再往 message 里写东西，
   * 否则未登录访问首页后，提示会一直带到面板页里。
   */
  async function restore(): Promise<SessionState> {
    if (!localStorage.getItem("token")) {
      user.value = null;
      state.value = "anon";
      return "anon";
    }

    try {
      const responseBody = await userAPI.getUserByAuthorization();

      if (responseBody.code === 20000 && responseBody.data) {
        user.value = responseBody.data;
        state.value = "authed";
        return "authed";
      }

      // token 无效或过期：清掉，回到未登录
      localStorage.removeItem("token");
      user.value = null;
      state.value = "anon";
      message.value = responseBody.message || "登录状态已失效，请重新登录";
      return "anon";
    } catch (error) {
      // 网络/服务异常：保留 token，下次导航或刷新时会重试
      user.value = null;
      state.value = "error";
      message.value = describe(error, "无法连接服务器，请稍后重试");
      return "error";
    }
  }

  /**
   * 确保登录态已恢复
   *
   * 路由守卫在进入 /dashboard 之前会 await 它，页面 onMounted 也可以调用（会自动复用请求）。
   */
  function ensureSession(): Promise<SessionState> {
    if (state.value === "authed") {
      return Promise.resolve("authed");
    }

    if (!pending) {
      pending = restore().finally(() => {
        pending = null;
      });
    }

    return pending;
  }

  function logout(): void {
    user.value = null;
    message.value = null;
    state.value = "anon";
    localStorage.removeItem("token");
  }

  /** 更新资料，返回是否成功 */
  async function update(params: UserUpdateDTO): Promise<boolean> {
    try {
      const responseBody = await userAPI.update(params);

      if (responseBody.code !== 20000 || !responseBody.data) {
        message.value = responseBody.message || "更新失败";
        return false;
      }

      applyUser(responseBody.data);
      return true;
    } catch (error) {
      message.value = describe(error, "更新失败，请稍后重试");
      return false;
    }
  }

  return {
    user,
    message,
    state,
    isAuthed,
    login,
    register,
    logout,
    ensureSession,
    getEmailCode,
    update,
  };
});
