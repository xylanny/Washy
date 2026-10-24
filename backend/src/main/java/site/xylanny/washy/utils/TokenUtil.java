package site.xylanny.washy.utils;

import cn.hutool.jwt.JWT;
import cn.hutool.jwt.JWTException;
import cn.hutool.jwt.JWTUtil;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import site.xylanny.washy.exception.BusinessException;
import site.xylanny.washy.model.enums.BusinessCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class TokenUtil {

    // JWT Payload中存储用户ID的键名
    private static final String USER_ID_CLAIM = "userId";
    // HTTP Authorization 头中 Token 的前缀标准格式
    private static final String BEARER_PREFIX = "Bearer ";

    @Value("${auth.token-secret}")
    private String tokenSecret;

    @Value("${auth.token-expire-seconds:2592000}")
    private long tokenExpireSeconds;

    /**
     * 创建Token
     * @param userId
     * @return token字符串
     */
    public String createToken(Long userId) {
        Date now = new Date();
        Date expiresAt = new Date(now.getTime() + tokenExpireSeconds * 1000);
        return JWT.create() // 创建一个新的JWT构建器(建造者模式！)
                .setIssuedAt(now) // Token的生成时间
                .setExpiresAt(expiresAt) // Token的有效截止时间
                .setPayload(USER_ID_CLAIM, userId) // 载荷中添加自定义数据
                .setKey(tokenSecret.getBytes(StandardCharsets.UTF_8)) // 设置签名密钥
                .sign(); // 执行签名操作，生成最终的JWT Token字符串
    }

    /**
     * 解析Token，获取用户ID
     * @param authorization 请求头中的Authorization字符串
     * @return 用户ID
     */
    public Long getUserId(String authorization) {
        if (authorization == null || !authorization.startsWith(BEARER_PREFIX)) {
            throw new BusinessException(BusinessCode.NOT_LOGIN);
        }
        String token = authorization.substring(BEARER_PREFIX.length()).trim();
        if (token.isEmpty()) {
            throw new BusinessException(BusinessCode.NOT_LOGIN);
        }
        try {
            JWT jwt = JWTUtil.parseToken(token);
            if (!jwt.setKey(tokenSecret.getBytes(StandardCharsets.UTF_8)).verify()) {
                throw new BusinessException(BusinessCode.NOT_LOGIN);
            }
            Object userId = jwt.getPayload(USER_ID_CLAIM);
            if (userId == null) {
                throw new BusinessException(BusinessCode.NOT_LOGIN);
            }
            return Long.valueOf(userId.toString());
        } catch (JWTException | NumberFormatException e) {
            throw new BusinessException(BusinessCode.NOT_LOGIN);
        }
    }
}
