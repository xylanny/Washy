package site.xylanny.washy.model.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class UserRegisterDTO implements Serializable {

    /**
     * 用户名
     */
    private String userName;

    /**
     * 用户电子邮箱
     */
    private String userEmail;

    /**
     * 邮箱验证码
     */
    private String emailCode;

    /**
     * 用户密码
     */
    private String userPassword;

    /**
     * 确认密码
     */
    private String checkedPassword;
}
