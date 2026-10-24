package site.xylanny.washy.exception;
import site.xylanny.washy.model.dto.Result;
import site.xylanny.washy.model.enums.BusinessCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;


@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public Result<?> handleBusinessException(BusinessException e) {
        log.error("业务异常", e);
        return Result.error(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public Result<?> runtimeExceptionHandler(RuntimeException e) {
        log.error("系统异常", e);
        return Result.error(BusinessCode.SYSTEM_ERROR);
    }
}
