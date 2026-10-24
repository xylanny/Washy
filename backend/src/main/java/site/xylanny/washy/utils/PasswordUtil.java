package site.xylanny.washy.utils;

import site.xylanny.washy.exception.BusinessException;
import site.xylanny.washy.model.enums.BusinessCode;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PasswordUtil {

    // BCrypt工作因子
    private static final int BCRYPT_STRENGTH = 10;

    private static final PasswordEncoder ENCODER = new BCryptPasswordEncoder(BCRYPT_STRENGTH);

    /**
     * 加密密码
     *
     * @param rawPassword 明文密码
     * @return 哈希密码
     */
    public String encode(String rawPassword){
        if(rawPassword == null || rawPassword.isBlank()){
            throw new BusinessException(BusinessCode.PARAMS_ERROR, "密码不能为空");
        }

        return ENCODER.encode(rawPassword);
    }

    public boolean matches(String rawPassword, String encodedPassword){
        if(rawPassword == null || encodedPassword == null){
            return false;
        }

        return ENCODER.matches(rawPassword, encodedPassword);
    }
}
