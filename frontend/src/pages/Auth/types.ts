export type AuthMode = "login" | "register";

export interface LoginForm {
  userEmail: string;
  userPassword: string;
}

export interface RegisterForm {
  userName: string;
  userEmail: string;
  userPassword: string;
  checkedPassword: string;
  emailCode: string;
}
