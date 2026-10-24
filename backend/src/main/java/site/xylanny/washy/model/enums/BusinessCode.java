package site.xylanny.washy.model.enums;

import lombok.Getter;

@Getter
public enum BusinessCode {
    SUCCESS(20000, "操作成功"),

    /**
     * 客户端错误（4xxxx）
     */
    PARAMS_ERROR(40001, "请求参数错误"),
    PARAMS_MISSING(40002, "缺少必要参数"),
    PARAMS_INVALID(40003, "参数格式错误"),

    /**
     * 认证授权（401xx）
     */
    NOT_LOGIN(40101, "未登录"),
    TOKEN_EXPIRED(40102, "Token已过期"),
    TOKEN_INVALID(40103, "Token无效"),
    NO_PERMISSION(40104, "无操作权限"),

    /**
     * 业务逻辑错误（6xxxx）
     */
    USER_EXISTS(60001, "用户已存在"),
    USER_NOT_EXISTS(60002, "用户不存在"),
    PASSWORD_ERROR(60003, "密码错误"),
    PASSWORD_DISPARITY(60004, "两次密码不一致"),
    EMAIL_CODE_ERROR(60005, "邮箱验证码错误或已过期"),
    EMAIL_CODE_TOO_FREQUENT(60006, "验证码发送过于频繁"),
    CHART_NOT_EXISTS(60010, "图表不存在"),
    CHART_NAME_DUPLICATE(60011, "图表名称重复"),

    /**
     * 服务器端错误（5xxxx）
     */
    SYSTEM_ERROR(50000, "系统内部错误"),
    DATABASE_ERROR(50001, "数据库操作失败"),
    THIRD_PARTY_ERROR(50002, "第三方服务调用失败");

    private final  int code;
    private final String message;

    BusinessCode(int code, String message){
        this.code = code;
        this.message = message;
    }
}
