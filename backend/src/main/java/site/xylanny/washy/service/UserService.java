package site.xylanny.washy.service;

import site.xylanny.washy.model.dto.UserVO;
import site.xylanny.washy.model.entity.User;

/**
* @author Jun
* @description 针对表【user(用户表)】的数据库操作Service
* @createDate 2026-09-08 10:56:19
*/
public interface UserService  {


    /**
     * 用户注册并校验邮箱验证码
     *
     * @param userName 用户昵称
     * @param userEmail 用户账户
     * @param userPassword 用户密码
     * @param checkPassword 校验密码
     * @return 新用户信息
     */
    UserVO register(String userName, String userEmail, String emailCode, String userPassword, String checkPassword);

    /**
     * 向邮箱发送注册验证码
     *
     * @param userEmail 收件邮箱
     */
    void sendRegisterEmailCode(String userEmail);

    /**
     * 用户登录
     *
     * @param userEmail 用户邮箱
     * @param userPassword 用户密码
     * @return 用户信息
     */
    UserVO login(String userEmail, String userPassword);

    /**
     * 去除密码（敏感信息）的用户信息
     *
     * @param user 原始用户信息
     * @return 去敏的用户信息
     */
    public UserVO getUserVO(User user);

    /**
     * 获取当前登录用户
     *
     * @param authorization 请求头中的Authorization字符串
     * @return
     */
    public UserVO getUserByAuthorization(String authorization);

    /**
     * 更新用户信息（除了用户密码）
     *
     * @param user 新的用户信息
     * @return
     */
    public UserVO update(User user);

}
