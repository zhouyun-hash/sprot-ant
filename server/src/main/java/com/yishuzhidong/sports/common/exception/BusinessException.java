package com.yishuzhidong.sports.common.exception;

import lombok.Getter;

/**
 * 业务异常：携带错误码与提示，由全局处理器转为统一 JSON。
 */
@Getter
public class BusinessException extends RuntimeException {

    private final int code;

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public BusinessException(String message) {
        this(400, message);
    }
}
