# -*- coding: utf-8 -*-
"""阿里云视觉能力封装：人体姿态关键点与动作识别。"""

from __future__ import annotations

import json
import os
import time
from typing import Any, Optional

from aliyunsdkcore.client import AcsClient
from aliyunsdkcore.request import CommonRequest
from aliyunsdkcore.acs_exception.exceptions import ClientException, ServerException

from app.utils.logger import get_logger

logger = get_logger(__name__)


class AliyunVision:
    """阿里云视觉调用封装（RPC + SDK Core）。"""

    def __init__(self, access_key_id: str, access_key_secret: str) -> None:
        if not access_key_id or not access_key_secret:
            raise ValueError("access_key_id / access_key_secret 不能为空")
        self._client = AcsClient(access_key_id, access_key_secret, "cn-shanghai")
        self._max_retries = int(os.getenv("ALIYUN_VISION_MAX_RETRIES", "3"))
        self._retry_base_seconds = float(os.getenv("ALIYUN_VISION_RETRY_BASE_SECONDS", "0.5"))

        self._pose_domain = os.getenv("ALIYUN_POSE_DOMAIN", "facebody.cn-shanghai.aliyuncs.com")
        self._pose_version = os.getenv("ALIYUN_POSE_VERSION", "2019-12-30")
        self._pose_action = os.getenv("ALIYUN_POSE_ACTION", "DetectBodyKeypoints")

        # 若动作识别 API 在账号/区域不可用，可通过环境变量切换
        self._action_domain = os.getenv("ALIYUN_ACTION_DOMAIN", "videorecog.cn-shanghai.aliyuncs.com")
        self._action_version = os.getenv("ALIYUN_ACTION_VERSION", "2020-03-20")
        self._action_action = os.getenv("ALIYUN_ACTION_ACTION", "RecognizeAction")

    def pose_detection(self, image_base64: str) -> dict[str, Any]:
        """
        调用阿里云人体姿态关键点 API，返回关键点坐标。

        默认参数为 Facebody DetectBodyKeypoints（ImageData）。
        """
        if not image_base64:
            raise ValueError("image_base64 不能为空")
        payload = self._rpc_call(
            domain=self._pose_domain,
            version=self._pose_version,
            action=self._pose_action,
            params={"ImageData": image_base64},
        )
        return {
            "raw": payload,
            "keypoints": self._extract_keypoints(payload),
        }

    def action_recognition(self, video_url: str) -> dict[str, Any]:
        """
        调用动作识别 API（若账号已开通该能力）。

        默认使用 videorecog RecognizeAction，可通过环境变量覆盖。
        """
        if not video_url:
            raise ValueError("video_url 不能为空")
        payload = self._rpc_call(
            domain=self._action_domain,
            version=self._action_version,
            action=self._action_action,
            params={"VideoUrl": video_url},
        )
        return {"raw": payload}

    def _rpc_call(
        self,
        *,
        domain: str,
        version: str,
        action: str,
        params: dict[str, Any],
    ) -> dict[str, Any]:
        last_error: Exception | None = None
        for attempt in range(1, self._max_retries + 1):
            try:
                request = CommonRequest()
                request.set_accept_format("json")
                request.set_domain(domain)
                request.set_method("POST")
                request.set_protocol_type("https")
                request.set_version(version)
                request.set_action_name(action)
                for key, value in params.items():
                    request.add_query_param(key, value)

                resp = self._client.do_action_with_exception(request)
                if isinstance(resp, (bytes, bytearray)):
                    return json.loads(resp.decode("utf-8"))
                if isinstance(resp, str):
                    return json.loads(resp)
                raise RuntimeError("阿里云返回数据格式异常")
            except (ClientException, ServerException, RuntimeError, json.JSONDecodeError) as exc:
                last_error = exc
                if attempt >= self._max_retries:
                    break
                sleep_s = self._retry_base_seconds * (2 ** (attempt - 1))
                logger.warning(
                    "Aliyun RPC 调用失败，准备重试 attempt=%s/%s action=%s err=%s",
                    attempt,
                    self._max_retries,
                    action,
                    exc,
                )
                time.sleep(sleep_s)
        logger.error("Aliyun RPC 调用最终失败 action=%s error=%s", action, last_error)
        raise RuntimeError(f"Aliyun RPC 调用失败: {last_error}") from last_error

    @staticmethod
    def _extract_keypoints(payload: dict[str, Any]) -> list[dict[str, Any]]:
        candidates = [
            payload.get("Data"),
            payload.get("BodyData"),
            payload,
        ]
        for block in candidates:
            if isinstance(block, dict):
                for key in ("KeyPoints", "BodyKeyPoints", "PoseKeyPoints", "Points"):
                    points = block.get(key)
                    if isinstance(points, list):
                        return points
        return []


class AliyunVisionService:
    """兼容旧调用的服务封装。"""

    def __init__(self) -> None:
        self._access_key_id = os.getenv("ALIYUN_ACCESS_KEY_ID", "")
        self._access_key_secret = os.getenv("ALIYUN_ACCESS_KEY_SECRET", "")
        self._vision: Optional[AliyunVision] = None
        if self.is_configured():
            self._vision = AliyunVision(self._access_key_id, self._access_key_secret)

    def is_configured(self) -> bool:
        return bool(self._access_key_id and self._access_key_secret)

    async def analyze_placeholder(self, image_url: Optional[str], scene: str) -> dict[str, Any]:
        """兼容接口：保留占位行为。"""
        if not self.is_configured():
            logger.warning("Aliyun credentials not set; returning mock response")
            return {
                "ok": False,
                "message": "未配置 ALIYUN_ACCESS_KEY_ID / ALIYUN_ACCESS_KEY_SECRET",
                "scene": scene,
                "image_url": image_url,
            }
        logger.info("Aliyun vision analyze called scene=%s", scene)
        return {"ok": True, "scene": scene, "message": "AliyunVision 已接入，可调用具体方法"}
