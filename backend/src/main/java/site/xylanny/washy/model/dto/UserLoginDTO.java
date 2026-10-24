package site.xylanny.washy.model.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class UserLoginDTO implements Serializable {

    private String userEmail;

    private String userPassword;
}
