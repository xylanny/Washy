package site.xylanny.washy.exception;

import site.xylanny.washy.model.enums.BusinessCode;
import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException{

    private final int code;

    /**
     * 使用业务状态码构造业务异常
     *
     * @param businessCode 业务状态码
     */
    public BusinessException(BusinessCode businessCode){
        super(businessCode.getMessage());
        this.code = businessCode.getCode();
    }

    /**
     * 自定义业务异常消息
     *
     * @param businessCode  业务状态码
     * @param customMessage 自定义错误消息（会覆盖 BusinessCode 中的默认消息）
     */
    public BusinessException(BusinessCode businessCode, String customMessage){
        super(customMessage);
        this.code = businessCode.getCode();
    }

    public BusinessException(BusinessCode businessCode, String customMessage, Throwable cause){
        super(customMessage, cause);
        this.code = businessCode.getCode();
    }

}
