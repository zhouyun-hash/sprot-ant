package com.yishuzhidong.sports.module.pe.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yishuzhidong.sports.common.exception.BusinessException;
import com.yishuzhidong.sports.common.util.JsonHelper;
import com.yishuzhidong.sports.module.entity.BizStudent;
import com.yishuzhidong.sports.module.entity.PeScore;
import com.yishuzhidong.sports.module.mapper.BizStudentMapper;
import com.yishuzhidong.sports.module.mapper.PeScoreMapper;
import com.yishuzhidong.sports.module.mapper.PeTaskMapper;
import com.yishuzhidong.sports.module.pe.constants.PeConstants;
import com.yishuzhidong.sports.module.pe.dto.PageData;
import com.yishuzhidong.sports.module.pe.dto.PeScoreReviewRequest;
import com.yishuzhidong.sports.module.pe.dto.PeScoreSaveRequest;
import com.yishuzhidong.sports.module.pe.dto.PeScoreVO;
import com.yishuzhidong.sports.module.pe.service.PeScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 体测成绩业务实现。
 */
@Service
@RequiredArgsConstructor
public class PeScoreServiceImpl implements PeScoreService {

    private final PeScoreMapper peScoreMapper;
    private final PeTaskMapper peTaskMapper;
    private final BizStudentMapper bizStudentMapper;
    private final JsonHelper jsonHelper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long create(PeScoreSaveRequest request) {
        validateForeignKeys(request.getStudentId(), request.getTaskId());
        LambdaQueryWrapper<PeScore> dup = new LambdaQueryWrapper<PeScore>()
                .eq(PeScore::getStudentId, request.getStudentId())
                .eq(PeScore::getTaskId, request.getTaskId())
                .eq(PeScore::getProject, request.getProject());
        if (peScoreMapper.selectCount(dup) > 0) {
            throw new BusinessException(409, "该学生在本任务该项目下已有成绩，请使用更新或 upsert 接口");
        }
        PeScore e = new PeScore();
        fillEntity(e, request, true);
        peScoreMapper.insert(e);
        return e.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(Long id, PeScoreSaveRequest request) {
        PeScore existing = peScoreMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(404, "成绩不存在: " + id);
        }
        validateForeignKeys(request.getStudentId(), request.getTaskId());
        fillEntity(existing, request, false);
        peScoreMapper.updateById(existing);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        if (peScoreMapper.selectById(id) == null) {
            throw new BusinessException(404, "成绩不存在: " + id);
        }
        peScoreMapper.deleteById(id);
    }

    @Override
    public PeScoreVO get(Long id) {
        PeScore e = peScoreMapper.selectById(id);
        if (e == null) {
            throw new BusinessException(404, "成绩不存在: " + id);
        }
        return toVo(e);
    }

    @Override
    public PageData<PeScoreVO> page(long current, long size, Long taskId, Long studentId, String reviewStatus) {
        LambdaQueryWrapper<PeScore> q = new LambdaQueryWrapper<>();
        if (taskId != null) {
            q.eq(PeScore::getTaskId, taskId);
        }
        if (studentId != null) {
            q.eq(PeScore::getStudentId, studentId);
        }
        if (StringUtils.hasText(reviewStatus)) {
            q.eq(PeScore::getReviewStatus, reviewStatus);
        }
        q.orderByDesc(PeScore::getCreatedAt);
        Page<PeScore> p = peScoreMapper.selectPage(new Page<>(current, size), q);
        List<PeScoreVO> list = p.getRecords().stream().map(this::toVo).collect(Collectors.toList());
        return new PageData<>(p.getTotal(), p.getCurrent(), p.getSize(), list);
    }

    @Override
    public List<PeScoreVO> listByTaskId(Long taskId) {
        LambdaQueryWrapper<PeScore> q = new LambdaQueryWrapper<PeScore>()
                .eq(PeScore::getTaskId, taskId)
                .orderByAsc(PeScore::getStudentId)
                .orderByAsc(PeScore::getProject);
        return peScoreMapper.selectList(q).stream().map(this::toVo).collect(Collectors.toList());
    }

    @Override
    public List<PeScoreVO> listByStudentId(Long studentId) {
        LambdaQueryWrapper<PeScore> q = new LambdaQueryWrapper<PeScore>()
                .eq(PeScore::getStudentId, studentId)
                .orderByDesc(PeScore::getCreatedAt);
        return peScoreMapper.selectList(q).stream().map(this::toVo).collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void review(Long id, PeScoreReviewRequest request) {
        PeScore e = peScoreMapper.selectById(id);
        if (e == null) {
            throw new BusinessException(404, "成绩不存在: " + id);
        }
        String rs = request.getReviewStatus();
        if (!PeConstants.REVIEW_APPROVED.equals(rs) && !PeConstants.REVIEW_REJECTED.equals(rs)) {
            throw new BusinessException("复核状态仅支持 approved / rejected");
        }
        e.setReviewStatus(rs);
        peScoreMapper.updateById(e);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long upsert(PeScoreSaveRequest request) {
        validateForeignKeys(request.getStudentId(), request.getTaskId());
        LambdaQueryWrapper<PeScore> q = new LambdaQueryWrapper<PeScore>()
                .eq(PeScore::getStudentId, request.getStudentId())
                .eq(PeScore::getTaskId, request.getTaskId())
                .eq(PeScore::getProject, request.getProject());
        PeScore existing = peScoreMapper.selectOne(q);
        if (existing == null) {
            PeScore e = new PeScore();
            fillEntity(e, request, true);
            peScoreMapper.insert(e);
            return e.getId();
        }
        fillEntity(existing, request, false);
        peScoreMapper.updateById(existing);
        return existing.getId();
    }

    private void validateForeignKeys(Long studentId, Long taskId) {
        if (bizStudentMapper.selectById(studentId) == null) {
            throw new BusinessException(400, "学生不存在: " + studentId);
        }
        if (peTaskMapper.selectById(taskId) == null) {
            throw new BusinessException(400, "体测任务不存在: " + taskId);
        }
    }

    private void fillEntity(PeScore e, PeScoreSaveRequest request, boolean isCreate) {
        e.setStudentId(request.getStudentId());
        e.setTaskId(request.getTaskId());
        e.setProject(request.getProject());
        e.setResult(request.getResult());
        e.setUnit(request.getUnit());
        if (request.getAiRawData() != null && !request.getAiRawData().isEmpty()) {
            e.setAiRawData(jsonHelper.toJson(request.getAiRawData()));
        }
        if (StringUtils.hasText(request.getReviewStatus())) {
            e.setReviewStatus(request.getReviewStatus());
        } else if (isCreate) {
            e.setReviewStatus(PeConstants.REVIEW_PENDING);
        }
    }

    private PeScoreVO toVo(PeScore e) {
        PeScoreVO vo = new PeScoreVO();
        vo.setId(e.getId());
        vo.setStudentId(e.getStudentId());
        vo.setTaskId(e.getTaskId());
        vo.setProject(e.getProject());
        vo.setResult(e.getResult());
        vo.setUnit(e.getUnit());
        vo.setAiRawData(jsonHelper.parseMap(e.getAiRawData()));
        vo.setReviewStatus(e.getReviewStatus());
        vo.setCreatedAt(e.getCreatedAt());
        return vo;
    }
}
