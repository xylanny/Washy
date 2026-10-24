package site.xylanny.washy.service;

public interface EmailService {

    /**
     * 发送邮箱验证码
     *
     * @param email 收件人邮箱地址
     */
    void sendRegisterCode(String email);

    /**
     *验证用户输入的未知邮箱验证码
     *
     * @param email 收件人邮箱地址
     * @param code 用户传递的未知邮箱验证码
     */
    void verifyRegisterCode(String email, String code);
}
