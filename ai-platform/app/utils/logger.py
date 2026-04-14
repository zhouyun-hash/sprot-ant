# -*- coding: utf-8 -*-
"""应用日志：统一格式、级别与控制台输出。"""

import logging
import sys
from typing import Optional

_LOG_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def setup_logging(level: int = logging.INFO) -> None:
    """配置根日志，避免重复添加 handler。"""
    root = logging.getLogger()
    if root.handlers:
        return
    root.setLevel(level)
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)
    handler.setFormatter(logging.Formatter(_LOG_FORMAT, _DATE_FORMAT))
    root.addHandler(handler)


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """获取命名 logger，便于按模块区分。"""
    return logging.getLogger(name or "ai-platform")
