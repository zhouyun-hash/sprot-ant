import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../../store/user_store.dart';
import '../../utils/http.dart';

/// 后端 AI 实时通道为 **Socket.IO**（`/ai` 命名空间），与原生 WebSocket 协议不同；
/// 此处使用 [socket_io_client] 连接并订阅 `ai:result`（`web_socket_channel` 无法直接对接）。
class LiveScorePage extends StatefulWidget {
  const LiveScorePage({super.key});

  @override
  State<LiveScorePage> createState() => _LiveScorePageState();
}

class _LiveStudentRow {
  _LiveStudentRow({
    required this.studentId,
    required this.name,
    this.count = 0,
    this.violations = const [],
  });

  final int studentId;
  String name;
  int count;
  List<String> violations;
}

class _LiveScorePageState extends State<LiveScorePage> {
  late String _sessionId;
  int? _classId;

  io.Socket? _socket;
  bool _wsConnected = false;
  String? _wsError;

  bool _studentsLoading = false;
  String? _studentsLoadError;

  final Map<int, _LiveStudentRow> _rows = {};
  final List<int> _order = [];

  bool _ending = false;

  @override
  void initState() {
    super.initState();
    final args = Get.arguments;
    final Map<String, dynamic> data =
        args is Map ? Map<String, dynamic>.from(args) : <String, dynamic>{};
    _sessionId = data['sessionId']?.toString() ?? '';
    _classId = _parseInt(data['classId']);

    if (_sessionId.isEmpty) {
      _wsError = '缺少 sessionId';
    } else {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        unawaited(_loadStudents());
        _connectSocket();
      });
    }
  }

  int? _parseInt(dynamic v) {
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v?.toString() ?? '');
  }

  String _studentNameFromItem(Map<String, dynamic> item) {
    final user = item['user'];
    if (user is Map) {
      final name = user['name']?.toString();
      if (name != null && name.isNotEmpty) return name;
    }
    final no = item['studentNo']?.toString();
    if (no != null && no.isNotEmpty) return no;
    return '学生 ${item['id'] ?? ''}';
  }

  Future<void> _loadStudents() async {
    final classId = _classId;
    if (classId == null) return;

    setState(() {
      _studentsLoading = true;
      _studentsLoadError = null;
    });
    try {
      final Response res = await Http.dio.get(
        '/classes/$classId/students',
        queryParameters: {'page': 1, 'pageSize': 200},
      );
      final data = res.data as Map<String, dynamic>? ?? {};
      final raw = (data['items'] as List?) ?? const [];
      if (!mounted) return;
      setState(() {
        for (final e in raw) {
          if (e is! Map) continue;
          final m = Map<String, dynamic>.from(e);
          final id = _parseInt(m['id']);
          if (id == null) continue;
          if (_rows.containsKey(id)) continue;
          _rows[id] = _LiveStudentRow(
            studentId: id,
            name: _studentNameFromItem(m),
          );
          _order.add(id);
        }
      });
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() {
        _studentsLoadError = e.response?.data?.toString() ?? e.message ?? '加载学生失败';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _studentsLoadError = e.toString());
    } finally {
      if (mounted) setState(() => _studentsLoading = false);
    }
  }

  void _connectSocket() {
    if (_sessionId.isEmpty) return;

    final token = Get.find<UserStore>().token.value;
    if (token.isEmpty) {
      setState(() => _wsError = '未登录，无法连接实时通道');
      return;
    }

    final base = Http.normalizedBaseUrl();
    final uri = '$base/ai';

    _socket?.disconnect();
    _socket?.dispose();

    _socket = io.io(
      uri,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .enableAutoConnect()
          .setExtraHeaders({'Authorization': 'Bearer $token'})
          .build(),
    );

    _socket!
      ..onConnect((_) {
        _socket!.emit('ai:subscribe', {'sessionId': _sessionId});
        if (mounted) {
          setState(() {
            _wsConnected = true;
            _wsError = null;
          });
        }
      })
      ..on('ai:result', _onAiResult)
      ..on('ai:error', (dynamic data) {
        final msg = data is Map ? data['message']?.toString() : data?.toString();
        if (mounted) {
          setState(() => _wsError = msg ?? '实时通道错误');
        }
      })
      ..onDisconnect((_) {
        if (mounted) setState(() => _wsConnected = false);
      })
      ..onConnectError((dynamic e) {
        if (mounted) {
          setState(() {
            _wsConnected = false;
            _wsError = e?.toString() ?? '连接失败';
          });
        }
      });
  }

  List<String> _parseViolations(dynamic v) {
    if (v is! List) return const [];
    return v.map((e) => e.toString()).where((s) => s.isNotEmpty).toList();
  }

  void _onAiResult(dynamic data) {
    if (data is! Map) return;
    final m = Map<String, dynamic>.from(data);
    final sid = _parseInt(m['studentId']);
    if (sid == null) return;
    final count = m['count'];
    final nextCount = count is int
        ? count
        : count is num
            ? count.toInt()
            : int.tryParse(count?.toString() ?? '') ?? 0;
    final violations = _parseViolations(m['violations']);

    if (!mounted) return;
    setState(() {
      final existing = _rows[sid];
      if (existing != null) {
        existing.count = nextCount;
        existing.violations = violations;
      } else {
        _rows[sid] = _LiveStudentRow(
          studentId: sid,
          name: '学生 $sid',
          count: nextCount,
          violations: violations,
        );
        _order.add(sid);
      }
    });
  }

  Future<void> _endTask() async {
    if (_ending) return;
    setState(() => _ending = true);
    try {
      await Http.dio.delete('/ai/session/$_sessionId');
      _tearDownSocket();
      if (mounted) Get.back();
    } on DioException catch (e) {
      final msg = e.response?.data;
      String text = '结束会话失败';
      if (msg is Map && msg['message'] != null) {
        final m = msg['message'];
        text = m is List ? m.join(', ') : m.toString();
      } else if (e.message != null) {
        text = e.message!;
      }
      if (mounted) Get.snackbar('结束任务', text);
    } catch (e) {
      if (mounted) Get.snackbar('结束任务', e.toString());
    } finally {
      if (mounted) setState(() => _ending = false);
    }
  }

  void _tearDownSocket() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _wsConnected = false;
  }

  @override
  void dispose() {
    _tearDownSocket();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ids = List<int>.from(_order);

    return Scaffold(
      appBar: AppBar(title: const Text('实时成绩')),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_wsError != null)
            MaterialBanner(
              content: Text(_wsError!),
              backgroundColor: theme.colorScheme.errorContainer,
              actions: [
                TextButton(
                  onPressed: () {
                    if (_sessionId.isNotEmpty) _connectSocket();
                  },
                  child: const Text('重连'),
                ),
              ],
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: Row(
              children: [
                Icon(
                  _wsConnected ? Icons.cloud_done : Icons.cloud_off,
                  size: 18,
                  color: _wsConnected
                      ? theme.colorScheme.primary
                      : theme.colorScheme.outline,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _wsConnected ? '已连接 · $_sessionId' : '未连接 · $_sessionId',
                    style: theme.textTheme.bodySmall,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          if (_studentsLoading)
            const LinearProgressIndicator(minHeight: 2),
          if (_studentsLoadError != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                _studentsLoadError!,
                style: TextStyle(color: theme.colorScheme.error, fontSize: 12),
              ),
            ),
          Expanded(
            child: ids.isEmpty
                ? Center(
                    child: Text(
                      '暂无学生数据，等待 AI 上报或检查班级学生',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                    itemCount: ids.length,
                    itemBuilder: (context, index) {
                      final row = _rows[ids[index]]!;
                      final hasViolation =
                          row.violations.isNotEmpty;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                row.name,
                                style: theme.textTheme.titleMedium,
                              ),
                              const SizedBox(height: 6),
                              Text(
                                '当前计数：${row.count}',
                                style: theme.textTheme.bodyLarge,
                              ),
                              if (hasViolation) ...[
                                const SizedBox(height: 8),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Icon(
                                      Icons.warning_amber_rounded,
                                      size: 18,
                                      color: theme.colorScheme.error,
                                    ),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        row.violations.join('；'),
                                        style: theme.textTheme.bodyMedium?.copyWith(
                                          color: theme.colorScheme.error,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: FilledButton(
            onPressed: _ending ? null : _endTask,
            style: FilledButton.styleFrom(
              backgroundColor: theme.colorScheme.error,
              foregroundColor: theme.colorScheme.onError,
            ),
            child: _ending
                ? SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: theme.colorScheme.onError,
                    ),
                  )
                : const Text('结束任务'),
          ),
        ),
      ),
    );
  }
}
