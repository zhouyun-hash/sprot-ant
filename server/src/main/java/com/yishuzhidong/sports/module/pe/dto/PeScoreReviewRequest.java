package com.yishuzhidong.sports.module.pe.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * 异常成绩复核：通过或驳回。
 */
@Data
public class PeScoreReviewRequest {

    /** approved / rejected */
    @NotBlank(message = "复核结果不能为空")
    private String reviewStatus;
}
