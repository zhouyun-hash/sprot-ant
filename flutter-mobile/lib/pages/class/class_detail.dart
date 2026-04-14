import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../utils/http.dart';
import '../../widgets/load_state_view.dart';

/// 与后端 self-training / AI 算法一致的运动项目枚举（展示文案）。
const List<String> kAiProjectOptions = ['跳绳', '仰卧起坐', '立定跳远', '跑步'];

class ClassDetailPage extends StatefulWidget {
  const ClassDetailPage({super.key});

  @override
  State<ClassDetailPage> createState() => _ClassDetailPageState();
}

class _ClassDetailPageState extends State<ClassDetailPage> {
  bool _studentsLoading = false;
  String? _studentsError;
  List<Map<String, dynamic>> _students = const [];

  bool _sessionSubmitting = false;

  Map<String, dynamic> get _classData {
    final args = Get.arguments;
    if (args is Map) return Map<String, dynamic>.from(args);
    return <String, dynamic>{};
  }

  int? get _classId {
    final v = _classData['id'];
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v?.toString() ?? '');
  }

  @override
  void initState() {
    super.initState();
    _loadStudents();
  }

  Future<void> _loadStudents() async {
    final id = _classId;
    if (id == null) {
      setState(() => _studentsError = '缺少班级 id');
      return;
    }
    setState(() {
      _studentsLoading = true;
      _studentsError = null;
    });
    try {
      final Response res = await Http.dio.get(
        '/classes/$id/students',
        queryParameters: {'page': 1, 'pageSize': 200},
      );
      final data = res.data as Map<String, dynamic>? ?? {};
      final raw = (data['items'] as List?) ?? const [];
      setState(() {
        _students = raw
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
      });
    } on DioException catch (e) {
      final msg = e.response?.data;
      String text = '学生列表加载失败';
      if (msg is Map && msg['message'] != null) {
        final m = msg['message'];
        text = m is List ? m.join(', ') : m.toString();
      } else if (e.message != null) {
        text = e.message!;
      }
      setState(() => _studentsError = text);
    } catch (_) {
      setState(() => _studentsError = '学生列表加载失败');
    } finally {
      if (mounted) setState(() => _studentsLoading = false);
    }
  }

  String _studentTitle(Map<String, dynamic> item) {
    final user = item['user'];
    if (user is Map) {
      final name = user['name']?.toString();
      if (name != null && name.isNotEmpty) return name;
    }
    final no = item['studentNo']?.toString();
    if (no != null && no.isNotEmpty) return no;
    return '学生 ${item['id'] ?? ''}';
  }

  Future<List<Map<String, dynamic>>> _loadTasksForClass() async {
    final classId = _classId;
    if (classId == null) return [];

    final Response res = await Http.dio.get(
      '/tasks',
      queryParameters: {'page': 1, 'pageSize': 50, 'status': 'ongoing'},
    );
    final data = res.data as Map<String, dynamic>? ?? {};
    final raw = (data['items'] as List?) ?? const [];
    final List<Map<String, dynamic>> out = [];

    for (final e in raw) {
      if (e is! Map) continue;
      final m = Map<String, dynamic>.from(e);
      final ids = m['classIds'];
      if (ids is! List) continue;
      final contains = ids.any((x) {
        if (x is int) return x == classId;
        if (x is num) return x.toInt() == classId;
        return int.tryParse(x.toString()) == classId;
      });
      if (contains) out.add(m);
    }
    return out;
  }

  Future<void> _onStartClass() async {
    final classId = _classId;
    if (classId == null) {
      Get.snackbar('提示', '无法识别班级');
      return;
    }

    List<Map<String, dynamic>> tasks;
    try {
      tasks = await _loadTasksForClass();
    } catch (e) {
      Get.snackbar('加载失败', e.toString());
      return;
    }

    if (!mounted) return;
    if (tasks.isEmpty) {
      Get.snackbar(
        '暂无任务',
        '没有「进行中」且包含本班的课堂任务，请先在管理端创建并发布任务。',
      );
      return;
    }

    String project = kAiProjectOptions.first;
    int taskId = (tasks.first['id'] as num).toInt();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('开始上课'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('运动项目'),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: project,
                      items: kAiProjectOptions
                          .map(
                            (p) => DropdownMenuItem(value: p, child: Text(p)),
                          )
                          .toList(),
                      onChanged: (v) {
                        if (v == null) return;
                        setDialogState(() => project = v);
                      },
                    ),
                    if (tasks.length > 1) ...[
                      const SizedBox(height: 16),
                      const Text('课堂任务'),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<int>(
                        value: taskId,
                        items: tasks
                            .map(
                              (t) => DropdownMenuItem<int>(
                                value: (t['id'] as num).toInt(),
                                child: Text(
                                  t['name']?.toString() ?? '任务 ${t['id']}',
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: (v) {
                          if (v == null) return;
                          setDialogState(() => taskId = v);
                        },
                      ),
                    ],
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx, false),
                  child: const Text('取消'),
                ),
                FilledButton(
                  onPressed: () => Navigator.pop(ctx, true),
                  child: const Text('开始'),
                ),
              ],
            );
          },
        );
      },
    );

    if (confirmed != true || !mounted) return;

    setState(() => _sessionSubmitting = true);
    try {
      final Response res = await Http.dio.post(
        '/ai/session',
        data: {
          'taskId': taskId,
          'classId': classId,
          'project': project,
        },
      );
      final body = res.data as Map<String, dynamic>? ?? {};
      final sessionId = body['sessionId']?.toString() ?? '';
      if (sessionId.isEmpty) {
        throw Exception('未返回 sessionId');
      }
      Get.toNamed(
        '/live_score',
        arguments: {
          'sessionId': sessionId,
          'classId': classId,
          'taskId': taskId,
          'project': project,
        },
      );
    } on DioException catch (e) {
      final msg = e.response?.data;
      String text = '创建会话失败';
      if (msg is Map && msg['message'] != null) {
        final m = msg['message'];
        text = m is List ? m.join(', ') : m.toString();
      } else if (e.message != null) {
        text = e.message!;
      }
      Get.snackbar('创建会话失败', text);
    } catch (e) {
      Get.snackbar('创建会话失败', e.toString());
    } finally {
      if (mounted) setState(() => _sessionSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = _classData['name']?.toString() ?? '班级详情';
    final grade = _classData['grade']?.toString();
    final schoolYear = _classData['schoolYear']?.toString();
    final studentCount = _classData['studentCount'];

    return Scaffold(
      appBar: AppBar(title: Text(name)),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (grade != null && grade.isNotEmpty)
                  Text('年级：$grade', style: Theme.of(context).textTheme.bodyMedium),
                if (schoolYear != null && schoolYear.isNotEmpty)
                  Text('学年：$schoolYear',
                      style: Theme.of(context).textTheme.bodyMedium),
                Text(
                  '学生数（概览）：${studentCount ?? '-'}',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
          const Divider(),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Text(
              '学生列表',
              style: Theme.of(context).textTheme.titleSmall,
            ),
          ),
          Expanded(
            child: LoadStateView(
              loading: _studentsLoading,
              error: _studentsError,
              isEmpty: _students.isEmpty,
              emptyText: '本班暂无学生',
              onRefresh: _loadStudents,
              child: ListView.separated(
                itemCount: _students.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (_, i) {
                  final item = _students[i];
                  return ListTile(
                    leading: const CircleAvatar(child: Icon(Icons.person)),
                    title: Text(_studentTitle(item)),
                    subtitle: Text('学号：${item['studentNo'] ?? '-'}'),
                  );
                },
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: FilledButton.icon(
            onPressed: (_studentsLoading || _sessionSubmitting) ? null : _onStartClass,
            icon: _sessionSubmitting
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Theme.of(context).colorScheme.onPrimary,
                    ),
                  )
                : const Icon(Icons.play_arrow),
            label: Text(_sessionSubmitting ? '创建会话…' : '开始上课'),
          ),
        ),
      ),
    );
  }
}
