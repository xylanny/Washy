import client from '@/api/client';
import type { Result, UserVO, UserUpdateDTO, UserRegisterDTO, UserLoginDTO } from '../types';

export const userAPI = {
  update: (data: UserUpdateDTO): Promise<Result<UserVO>> => {
    return client.post(`/user/update`, data);
  },
  register: (data: UserRegisterDTO): Promise<Result<UserVO>> => {
    return client.post(`/user/register`, data);
  },
  // 需要判断业务码（例如 SMTP 发信失败是 50002），所以把 Result 原样返回
  sendEmailCode: (query: { userEmail?: string } = {}): Promise<Result<void>> => {
    const email = encodeURIComponent(query.userEmail ?? '');
    return client.post(`/user/mail?userEmail=${email}`);
  },
  login: (data: UserLoginDTO): Promise<Result<UserVO>> => {
    return client.post(`/user/login`, data);
  },
  getUserByAuthorization: (): Promise<Result<UserVO>> => {
    return client.get(`/user/info`);
  },
};
