# -*- coding: utf-8 -*-
"""AI 能力路由：视觉等扩展接口。"""

import math
import os
import time

from fastapi import APIRouter, HTTPException

from app.models.request import (
    ActionRecognitionRequest,
    PoseDetectionRequest,
    SkippingRequest,
    SitupRequest,
    VisionAnalyzeRequest,
)
from app.services.aliyun_vision import AliyunVision, AliyunVisionService
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/ai", tags=["ai"])

_vision = AliyunVisionService()
_skip_states: dict[str, dict] = {}
_skip_max_sessions = int(os.getenv("SKIPPING_MAX_SESSIONS", "2000"))
_skip_ttl_seconds = int(os.getenv("SKIPPING_SESSION_TTL_SECONDS", "1800"))
_skip_cleanup_stats = {
    "expired_removed": 0,
    "overflow_removed": 0,
    "cleanup_runs": 0,
}
_situp_states: dict[str, dict] = {}
_situp_cleanup_stats = {
    "expired_removed": 0,
    "overflow_removed": 0,
    "cleanup_runs": 0,
}


def _build_aliyun_vision() -> AliyunVision:
    ak = os.getenv("ALIYUN_ACCESS_KEY_ID", "")
    sk = os.getenv("ALIYUN_ACCESS_KEY_SECRET", "")
    if not ak or not sk:
        raise HTTPException(
            status_code=400,
            detail="未配置 ALIYUN_ACCESS_KEY_ID / ALIYUN_ACCESS_KEY_SECRET",
        )
    return AliyunVision(ak, sk)


def _get_xy(point: dict) -> tuple[float, float] | None:
    x = point.get("x", point.get("X"))
    y = point.get("y", point.get("Y"))
    if x is None or y is None:
        return None
    return float(x), float(y)


def _get_score(point: dict) -> float | None:
    v = point.get("score", point.get("Score", point.get("confidence", point.get("Confidence"))))
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _pick_point(points: list[dict], names: list[str], idx: int) -> dict | None:
    for p in points:
        name = str(p.get("name", p.get("Name", p.get("type", p.get("Type", ""))))).lower()
        if name in names:
            return p
    if 0 <= idx < len(points):
        return points[idx]
    return None


def _angle(a: tuple[float, float], b: tuple[float, float], c: tuple[float, float]) -> float:
    # 计算 ∠ABC（单位：度）
    v1 = (a[0] - b[0], a[1] - b[1])
    v2 = (c[0] - b[0], c[1] - b[1])
    n1 = math.hypot(v1[0], v1[1])
    n2 = math.hypot(v2[0], v2[1])
    if n1 == 0 or n2 == 0:
        return 180.0
    cosv = max(-1.0, min(1.0, (v1[0] * v2[0] + v1[1] * v2[1]) / (n1 * n2)))
    return math.degrees(math.acos(cosv))


def _cleanup_skip_states(now_ts: float) -> None:
    _skip_cleanup_stats["cleanup_runs"] += 1
    # 1) 先清理过期（按最后访问时间）
    expired_keys = [
        k
        for k, v in _skip_states.items()
        if now_ts - float(v.get("updated_at", 0)) > _skip_ttl_seconds
    ]
    for k in expired_keys:
        _skip_states.pop(k, None)
    _skip_cleanup_stats["expired_removed"] += len(expired_keys)

    # 2) 超容量时按最久未访问回收
    overflow = len(_skip_states) - _skip_max_sessions
    if overflow > 0:
        victims = sorted(
            _skip_states.items(),
            key=lambda kv: float(kv[1].get("updated_at", 0)),
        )[:overflow]
        for k, _ in victims:
            _skip_states.pop(k, None)
        _skip_cleanup_stats["overflow_removed"] += len(victims)


def _cleanup_situp_states(now_ts: float) -> None:
    _situp_cleanup_stats["cleanup_runs"] += 1
    expired_keys = [
        k
        for k, v in _situp_states.items()
        if now_ts - float(v.get("updated_at", 0)) > _skip_ttl_seconds
    ]
    for k in expired_keys:
        _situp_states.pop(k, None)
    _situp_cleanup_stats["expired_removed"] += len(expired_keys)

    overflow = len(_situp_states) - _skip_max_sessions
    if overflow > 0:
        victims = sorted(
            _situp_states.items(),
            key=lambda kv: float(kv[1].get("updated_at", 0)),
        )[:overflow]
        for k, _ in victims:
            _situp_states.pop(k, None)
        _situp_cleanup_stats["overflow_removed"] += len(victims)


@router.post("/vision/analyze")
async def vision_analyze(body: VisionAnalyzeRequest) -> dict:
    """示例：视觉分析占位接口。"""
    result = await _vision.analyze_placeholder(body.image_url, body.scene)
    logger.debug("vision analyze result keys=%s", list(result.keys()))
    return result


@router.post("/vision/pose")
async def vision_pose(body: PoseDetectionRequest) -> dict:
    """人体姿态关键点识别。"""
    try:
        client = _build_aliyun_vision()
        return client.pose_detection(body.image_base64)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("pose detection failed")
        raise HTTPException(status_code=502, detail=f"姿态识别调用失败: {exc}") from exc


@router.post("/vision/action")
async def vision_action(body: ActionRecognitionRequest) -> dict:
    """动作识别。"""
    try:
        client = _build_aliyun_vision()
        return client.action_recognition(body.video_url)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("action recognition failed")
        raise HTTPException(status_code=502, detail=f"动作识别调用失败: {exc}") from exc


@router.post("/skipping")
async def skipping(body: SkippingRequest) -> dict:
    """
    跳绳动作简版分析：
    - 调姿态关键点
    - 依据手臂夹角/手腕相对躯干位置判断违规
    - 使用手腕上下相位变化进行简易计数
    """
    try:
        now_ts = time.time()
        _cleanup_skip_states(now_ts)
        session_id = (body.session_id or "default").strip() or "default"
        state = _skip_states.setdefault(
            session_id,
            {"phase": None, "count": 0, "updated_at": now_ts},
        )
        if body.reset:
            state["phase"] = None
            state["count"] = 0
        state["updated_at"] = now_ts

        client = _build_aliyun_vision()
        pose = client.pose_detection(body.image_base64)
        keypoints = pose.get("keypoints", [])
        if not isinstance(keypoints, list) or not keypoints:
            return {
                "session_id": session_id,
                "count": int(state["count"]),
                "violations": ["未检测到人体关键点"],
                "confidence": 0.0,
            }

        # 命名优先，其次按 COCO 常见顺序兜底
        ls = _pick_point(keypoints, ["left_shoulder", "lshoulder"], 5)
        rs = _pick_point(keypoints, ["right_shoulder", "rshoulder"], 6)
        le = _pick_point(keypoints, ["left_elbow", "lelbow"], 7)
        re = _pick_point(keypoints, ["right_elbow", "relbow"], 8)
        lw = _pick_point(keypoints, ["left_wrist", "lwrist"], 9)
        rw = _pick_point(keypoints, ["right_wrist", "rwrist"], 10)
        lh = _pick_point(keypoints, ["left_hip", "lhip"], 11)
        rh = _pick_point(keypoints, ["right_hip", "rhip"], 12)

        required = [ls, rs, le, re, lw, rw, lh, rh]
        if any(p is None or _get_xy(p) is None for p in required):
            return {
                "session_id": session_id,
                "count": int(state["count"]),
                "violations": ["关键点不完整，无法判定"],
                "confidence": 0.2,
            }

        lsp, rsp = _get_xy(ls), _get_xy(rs)
        lep, rep = _get_xy(le), _get_xy(re)
        lwp, rwp = _get_xy(lw), _get_xy(rw)
        lhp, rhp = _get_xy(lh), _get_xy(rh)
        assert lsp and rsp and lep and rep and lwp and rwp and lhp and rhp

        violations: list[str] = []

        left_elbow_angle = _angle(lsp, lep, lwp)
        right_elbow_angle = _angle(rsp, rep, rwp)
        if left_elbow_angle > 170 or right_elbow_angle > 170:
            violations.append("手臂过直，建议肘部微屈")

        shoulder_y = (lsp[1] + rsp[1]) / 2.0
        hip_y = (lhp[1] + rhp[1]) / 2.0
        wrist_y = (lwp[1] + rwp[1]) / 2.0
        if wrist_y < shoulder_y:
            violations.append("手腕位置过高")
        if wrist_y > hip_y + max(8.0, abs(hip_y - shoulder_y) * 0.2):
            violations.append("手腕下沉过多")

        # 简单计数：手腕相对肩-髋中线的上下摆动触发相位切换
        center_y = (shoulder_y + hip_y) / 2.0
        current_phase = "up" if wrist_y < center_y else "down"
        prev_phase = state.get("phase")
        if prev_phase == "down" and current_phase == "up":
            state["count"] = int(state.get("count", 0)) + 1
        state["phase"] = current_phase
        state["updated_at"] = now_ts

        scores = [_get_score(p) for p in [ls, rs, le, re, lw, rw, lh, rh]]
        valid_scores = [s for s in scores if s is not None]
        confidence = sum(valid_scores) / len(valid_scores) if valid_scores else 0.65
        confidence = max(0.0, min(1.0, confidence))
        return {
            "session_id": session_id,
            "count": int(state["count"]),
            "violations": violations,
            "confidence": round(confidence, 4),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("skipping analyze failed")
        raise HTTPException(status_code=502, detail=f"跳绳分析失败: {exc}") from exc


@router.get("/skipping/stats")
async def skipping_stats() -> dict:
    """
    跳绳会话缓存统计（仅开发环境）。
    为避免暴露运行态信息，生产环境默认关闭。
    """
    if os.getenv("DEBUG") != "1":
        raise HTTPException(status_code=404, detail="Not Found")
    now_ts = time.time()
    _cleanup_skip_states(now_ts)
    sessions = [
        {
            "session_id": sid,
            "count": int(state.get("count", 0)),
            "phase": state.get("phase"),
            "updated_at": float(state.get("updated_at", 0)),
            "idle_seconds": round(now_ts - float(state.get("updated_at", 0)), 3),
        }
        for sid, state in _skip_states.items()
    ]
    sessions = sorted(sessions, key=lambda x: x["updated_at"], reverse=True)
    return {
        "cache_size": len(_skip_states),
        "max_sessions": _skip_max_sessions,
        "ttl_seconds": _skip_ttl_seconds,
        "cleanup_stats": _skip_cleanup_stats,
        "sessions_preview": sessions[:20],
    }


@router.post("/situp")
async def situp(body: SitupRequest) -> dict:
    """
    仰卧起坐简版分析：
    - 单帧计算头部-躯干角度
    - 连续请求按会话做相位切换计数（up/down）
    """
    try:
        now_ts = time.time()
        _cleanup_situp_states(now_ts)
        session_id = (body.session_id or "default").strip() or "default"
        state = _situp_states.setdefault(
            session_id,
            {"phase": None, "count": 0, "updated_at": now_ts},
        )
        if body.reset:
            state["phase"] = None
            state["count"] = 0
        state["updated_at"] = now_ts

        client = _build_aliyun_vision()
        pose = client.pose_detection(body.image_base64)
        keypoints = pose.get("keypoints", [])
        if not isinstance(keypoints, list) or not keypoints:
            return {
                "session_id": session_id,
                "count": int(state["count"]),
                "quality": "low",
                "message": "未检测到人体关键点",
                "trunk_angle": None,
                "confidence": 0.0,
            }

        nose = _pick_point(keypoints, ["nose"], 0)
        ls = _pick_point(keypoints, ["left_shoulder", "lshoulder"], 5)
        rs = _pick_point(keypoints, ["right_shoulder", "rshoulder"], 6)
        lh = _pick_point(keypoints, ["left_hip", "lhip"], 11)
        rh = _pick_point(keypoints, ["right_hip", "rhip"], 12)
        required = [nose, ls, rs, lh, rh]
        if any(p is None or _get_xy(p) is None for p in required):
            return {
                "session_id": session_id,
                "count": int(state["count"]),
                "quality": "low",
                "message": "关键点不完整，无法判定仰卧起坐",
                "trunk_angle": None,
                "confidence": 0.2,
            }

        n = _get_xy(nose)
        lsp, rsp = _get_xy(ls), _get_xy(rs)
        lhp, rhp = _get_xy(lh), _get_xy(rh)
        assert n and lsp and rsp and lhp and rhp
        shoulder = ((lsp[0] + rsp[0]) / 2.0, (lsp[1] + rsp[1]) / 2.0)
        hip = ((lhp[0] + rhp[0]) / 2.0, (lhp[1] + rhp[1]) / 2.0)

        # 头部-躯干夹角：∠(nose, shoulder, hip)
        trunk_angle = _angle(n, shoulder, hip)
        # 简化阈值：角度小=起身，角度大=躺下
        current_phase = "up" if trunk_angle < 120 else "down"
        prev_phase = state.get("phase")
        if prev_phase == "up" and current_phase == "down":
            state["count"] = int(state.get("count", 0)) + 1
        state["phase"] = current_phase
        state["updated_at"] = now_ts

        if trunk_angle < 105:
            quality = "good"
            msg = "起身幅度良好"
        elif trunk_angle < 130:
            quality = "medium"
            msg = "起身幅度一般，可再提高"
        else:
            quality = "low"
            msg = "起身不足或姿态不标准"

        scores = [_get_score(p) for p in [nose, ls, rs, lh, rh]]
        valid_scores = [s for s in scores if s is not None]
        confidence = sum(valid_scores) / len(valid_scores) if valid_scores else 0.65
        confidence = max(0.0, min(1.0, confidence))

        return {
            "session_id": session_id,
            "count": int(state["count"]),
            "quality": quality,
            "message": msg,
            "trunk_angle": round(trunk_angle, 2),
            "confidence": round(confidence, 4),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("situp analyze failed")
        raise HTTPException(status_code=502, detail=f"仰卧起坐分析失败: {exc}") from exc
