package com.yishuzhidong.sports.common.exception;

import com.yishuzhidong.sports.common.result.R;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常：参数校验、唯一键冲突、业务异常统一返回 {@link R}。
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public R<Void> handleBiz(BusinessException e) {
        return R.fail(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(DuplicateKeyException.class)
    public R<Void> handleDup(DuplicateKeyException e) {
        return R.fail(409, "数据已存在（唯一约束冲突）：" + e.getMostSpecificCause().getMessage());
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    public R<Void> handleValid(Exception e) {
        if (e instanceof MethodArgumentNotValidException) {
            org.springframework.validation.FieldError fe =
                    ((MethodArgumentNotValidException) e).getBindingResult().getFieldError();
            return R.fail(400, fe != null ? fe.getDefaultMessage() : e.getMessage());
        }
        org.springframework.validation.FieldError fe2 = ((BindException) e).getBindingResult().getFieldError();
        return R.fail(400, fe2 != null ? fe2.getDefaultMessage() : e.getMessage());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public R<Void> handleJson(HttpMessageNotReadableException e) {
        return R.fail(400, "请求体 JSON 格式错误或日期格式不正确");
    }

    @ExceptionHandler(Exception.class)
    public R<Void> handleOther(Exception e) {
        return R.fail(500, "服务器异常：" + e.getMessage());
    }
}
