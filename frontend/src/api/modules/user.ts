import client from '@/api/client';
import type { Result, UserVO, UserUpdateDTO, UserRegisterDTO, UserLoginDTO } from '../types';

export const userAPI = {
  update: (data: UserUpdateDTO): Promise<Result<UserVO>> => {
    return client.post(`/user/update`, data);
  },
  register: (data: UserRegisterDTO): Promise<Result<UserVO>> => {
    return client.post(`/user/register`, data);
  },
  sendEmailCode: (query: { userEmail?: string } = {}): Promise<void> => {
    return client.post(`/user/mail?userEmail=${query.userEmail}`).then(() => {});
  },
  login: (data: UserLoginDTO): Promise<Result<UserVO>> => {
    return client.post(`/user/login`, data);
  },
  getUserByAuthorization: (): Promise<Result<UserVO>> => {
    return client.get(`/user/info`);
  },
};