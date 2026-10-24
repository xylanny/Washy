package site.xylanny.washy.model.dto;

import site.xylanny.washy.model.enums.BusinessCode;
import lombok.Data;

@Data
public class Result<T> {

    private int code;
    private String message;
    private T data;

    private Result(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> Result<T> success(T data) {
        return new Result<>(BusinessCode.SUCCESS.getCode(),
                           BusinessCode.SUCCESS.getMessage(), data);
    }

    public static <T> Result<T> error(BusinessCode businessCode) {
        return new Result<>(businessCode.getCode(),
                           businessCode.getMessage(), null);
    }

    public static <T> Result<T> error(BusinessCode businessCode, String customMessage) {
        return new Result<>(businessCode.getCode(), customMessage, null);
    }


    public static <T> Result<T> error(int code, String message) {
        return new Result<>(code, message, null);
    }
}
