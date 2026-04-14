package com.yishuzhidong.sports.module.pe.service;

import com.yishuzhidong.sports.module.pe.dto.PageData;
import com.yishuzhidong.sports.module.pe.dto.PeScoreReviewRequest;
import com.yishuzhidong.sports.module.pe.dto.PeScoreSaveRequest;
import com.yishuzhidong.sports.module.pe.dto.PeScoreVO;

import java.util.List;

/**
 * 体测成绩：录入、分页查询、复核；与任务、学生外键一致。
 */
public interface PeScoreService {

    Long create(PeScoreSaveRequest request);

    void update(Long id, PeScoreSaveRequest request);

    void delete(Long id);

    PeScoreVO get(Long id);

    PageData<PeScoreVO> page(long current, long size, Long taskId, Long studentId, String reviewStatus);

    /** 按任务导出/大屏用：无分页，注意数据量 */
    List<PeScoreVO> listByTaskId(Long taskId);

    List<PeScoreVO> listByStudentId(Long studentId);

    void review(Long id, PeScoreReviewRequest request);

    /**
     * 同一学生+任务+项目若已存在则更新，否则插入（AI 多次上报场景）。
     */
    Long upsert(PeScoreSaveRequest request);
}
