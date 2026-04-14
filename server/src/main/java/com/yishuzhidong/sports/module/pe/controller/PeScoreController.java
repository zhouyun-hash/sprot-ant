package com.yishuzhidong.sports.module.pe.controller;

import com.yishuzhidong.sports.common.result.R;
import com.yishuzhidong.sports.module.pe.dto.PageData;
import com.yishuzhidong.sports.module.pe.dto.PeScoreReviewRequest;
import com.yishuzhidong.sports.module.pe.dto.PeScoreSaveRequest;
import com.yishuzhidong.sports.module.pe.dto.PeScoreVO;
import com.yishuzhidong.sports.module.pe.service.PeScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

/**
 * 体测成绩 REST：列表、录入、复核、按任务/学生查询（对接大屏、家长端同源数据）。
 */
@RestController
@RequestMapping("/api/pe/scores")
@RequiredArgsConstructor
public class PeScoreController {

    private final PeScoreService peScoreService;

    @PostMapping
    public R<Long> create(@Valid @RequestBody PeScoreSaveRequest request) {
        return R.ok(peScoreService.create(request));
    }

    @PutMapping("/{id}")
    public R<Void> update(@PathVariable Long id, @Valid @RequestBody PeScoreSaveRequest request) {
        peScoreService.update(id, request);
        return R.ok();
    }

    @PostMapping("/upsert")
    public R<Long> upsert(@Valid @RequestBody PeScoreSaveRequest request) {
        return R.ok(peScoreService.upsert(request));
    }

    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) {
        peScoreService.delete(id);
        return R.ok();
    }

    @GetMapping("/{id}")
    public R<PeScoreVO> get(@PathVariable Long id) {
        return R.ok(peScoreService.get(id));
    }

    @GetMapping("/page")
    public R<PageData<PeScoreVO>> page(
            @RequestParam(defaultValue = "1") long current,
            @RequestParam(defaultValue = "10") long size,
            @RequestParam(required = false) Long taskId,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) String reviewStatus) {
        return R.ok(peScoreService.page(current, size, taskId, studentId, reviewStatus));
    }

    @GetMapping("/by-task/{taskId}")
    public R<List<PeScoreVO>> byTask(@PathVariable Long taskId) {
        return R.ok(peScoreService.listByTaskId(taskId));
    }

    @GetMapping("/by-student/{studentId}")
    public R<List<PeScoreVO>> byStudent(@PathVariable Long studentId) {
        return R.ok(peScoreService.listByStudentId(studentId));
    }

    @PostMapping("/{id}/review")
    public R<Void> review(@PathVariable Long id, @Valid @RequestBody PeScoreReviewRequest request) {
        peScoreService.review(id, request);
        return R.ok();
    }
}
