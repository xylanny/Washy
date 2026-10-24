package site.xylanny.washy.model.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class UserUpdateDTO implements Serializable {

    /**
     * 用户名
     */
    private String userName;

    /**
     * 用户头像
     */
    private String userAvatar;
}
