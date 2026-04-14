package com.yishuzhidong.sports.module.pe.constants;

/**
 * 体测任务与成绩领域常量（与需求文档、库表枚举一致）。
 */
public final class PeConstants {

    private PeConstants() {
    }

    /** 任务状态 */
    public static final String TASK_DRAFT = "draft";
    public static final String TASK_PUBLISHED = "published";
    public static final String TASK_ONGOING = "ongoing";
    public static final String TASK_FINISHED = "finished";
    public static final String TASK_CANCELLED = "cancelled";

    /** 成绩复核 */
    public static final String REVIEW_PENDING = "pending";
    public static final String REVIEW_APPROVED = "approved";
    public static final String REVIEW_REJECTED = "rejected";
}
