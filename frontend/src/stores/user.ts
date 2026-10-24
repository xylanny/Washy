import { userAPI } from "@/api/modules/user";
import type {
  UserLoginDTO,
  UserRegisterDTO,
  UserUpdateDTO,
  UserVO,
} from "@/api/types";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useUserStore = defineStore("user", () => {
  const user = ref<UserVO | null>(null);
  const message = ref<string | null>(null);

  /**
   * 登录用户
   *
   * @param params - 包括用户邮箱、用户密码
   */
  async function login(params: UserLoginDTO): Promise<void> {
    // 向服务器发送请求
    const responseBody = await userAPI.login(params);

    // 若业务码为20000表示成功
    if (responseBody.code === 20000) {
      console.log(responseBody.code);
      user.value = responseBody.data;
      // 额外持久化token
      localStorage.setItem("token", user.value?.token as string);
    }
    // 若业务码为其他表示业务错误
    else {
      message.value = responseBody.message;
    }
  }

  /**
   * 注册用户
   *
   * @param params - 包括用户名、用户邮箱、用户秘密
   */
  async function register(params: UserRegisterDTO): Promise<void> {
    const responseBody = await userAPI.register(params);

    if (responseBody.code === 20000) {
      user.value = responseBody.data;
      localStorage.setItem("token", user.value?.token as string);
    } else {
      message.value = responseBody.message;
    }
  }

  function logout() {
    user.value = null;

    localStorage.removeItem("token");
  }

  /**
   * 获取用户信息，前提是已经认证成功了
   *
   */
  async function get(): Promise<void> {
    const responseBody = await userAPI.getUserByAuthorization();

    if (responseBody.code === 20000) {
      user.value = responseBody.data;
    } else {
      message.value = responseBody.message;
    }
  }

  /**
   * 实现下次登录用户信息恢复，前提是token存在、有效
   *
   */
  async function resume(): Promise<void> {
    // 若认证成功而存在用户信息，不需要恢复
    if (user.value) return;

    if (!localStorage.getItem("token")) {
      message.value = "令牌不存在，请重新认证";
      return;
    }

    try {
      await get();
    } catch (error) {
      message.value = (error as Error).message;

      localStorage.removeItem("token");
      user.value = null;
    }
  }

  /**
   * 获取邮箱验证码
   *
   * @param param - 邮箱地址字符串
   */
  function getEmailCode(param: string): void {
    userAPI.sendEmailCode({ userEmail: param });
  }

  async function update(param: UserUpdateDTO) {
    const responseBody = await userAPI.update(param);

    if (responseBody.code === 20000) {
      user.value = responseBody.data;
    } else {
      message.value = responseBody.message;
    }
  }

  return {
    user,
    message,
    login,
    logout,
    register,
    resume,
    getEmailCode,
    update,
  };
});
