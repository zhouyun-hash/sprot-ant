import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../utils/http.dart';
import '../../widgets/load_state_view.dart';

/// 与成绩/AI 侧一致的项目名称。
const List<String> kScoreProjectOptions = ['跳绳', '仰卧起坐', '立定跳远', '跑步'];

class _StudentLine {
  _StudentLine({
    required this.studentId,
    required this.name,
    required this.classId,
  });

  final int studentId;
  final String name;
  final int classId;
}

/// 任务签到 / 检录页。
class CheckinPage extends StatefulWidget {
  const CheckinPage({super.key});

  @override
  State<CheckinPage> createState() => _CheckinPageState();
}

class _CheckinPageState extends State<CheckinPage> {
  int? _taskId;
  String _taskName = '签到';

  bool _loading = true;
  String? _error;

  Map<String, dynamic>? _task;
  final List<_StudentLine> _students = [];
  final Map<int, bool> _checked = {};

  @override
  void initState() {
    super.initState();
    final args = Get.arguments;
    final Map<String, dynamic> data =
        args is Map ? Map<String, dynamic>.from(args) : <String, dynamic>{};
    _taskId = _toInt(data['taskId']);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_taskId != null) {
        _loadAll();
      } else {
        setState(() {
          _loading = false;
          _error = '缺少 taskId';
        });
      }
    });
  }

  int? _toInt(dynamic v) {
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v?.toString() ?? '');
  }

  String _nameFromStudentJson(Map<String, dynamic> m) {
    final user = m['user'];
    if (user is Map) {
      final name = user['name']?.toString();
      if (name != null && name.isNotEmpty) return name;
    }
    final no = m['studentNo']?.toString();
    if (no != null && no.isNotEmpty) return no;
    return '学生 ${m['id'] ?? ''}';
  }

  Future<void> _loadAll() async {
    final taskId = _taskId;
    if (taskId == null) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        Http.dio.get('/tasks/$taskId'),
        Http.dio.get('/tasks/$taskId/checkins'),
      ]);

      final taskData = results[0].data as Map<String, dynamic>? ?? {};
      final checkData = results[1].data as Map<String, dynamic>? ?? {};

      _task = taskData;
      _taskName = taskData['name']?.toString() ?? '任务签到';

      _checked.clear();
      for (final e in (checkData['items'] as List?) ?? const []) {
        if (e is! Map) continue;
        final m = Map<String, dynamic>.from(e);
        final sid = _toInt(m['studentId']);
        if (sid == null) continue;
        _checked[sid] = m['checked'] == true;
      }

      final classIdsRaw = taskData['classIds'];
      final List<int> classIds = [];
      if (classIdsRaw is List) {
        for (final c in classIdsRaw) {
          final id = _toInt(c);
          if (id != null) classIds.add(id);
        }
      }

      final Map<int, _StudentLine> byId = {};
      for (final cid in classIds) {
        final Response res = await Http.dio.get(
          '/classes/$cid/students',
          queryParameters: {'page': 1, 'pageSize': 200},
        );
        final data = res.data as Map<String, dynamic>? ?? {};
        for (final e in (data['items'] as List?) ?? const []) {
          if (e is! Map) continue;
          final m = Map<String, dynamic>.from(e);
          final sid = _toInt(m['id']);
          if (sid == null) continue;
          byId[sid] = _StudentLine(
            studentId: sid,
            name: _nameFromStudentJson(m),
            classId: cid,
          );
        }
      }

      _students
        ..clear()
        ..addAll(byId.values)
        ..sort((a, b) => a.name.compareTo(b.name));
    } on DioException catch (e) {
      final msg = e.response?.data;
      String text = '加载失败';
      if (msg is Map && msg['message'] != null) {
        final m = msg['message'];
        text = m is List ? m.join(', ') : m.toString();
      } else if (e.message != null) {
        text = e.message!;
      }
      setState(() => _error = text);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _setChecked(int studentId, bool value) async {
    final taskId = _taskId;
    if (taskId == null) return;

    final prev = _checked[studentId] ?? false;
    setState(() => _checked[studentId] = value);

    try {
      await Http.dio.post(
        '/tasks/$taskId/checkin',
        data: {'studentId': studentId, 'checked': value},
      );
    } on DioException catch (e) {
      setState(() => _checked[studentId] = prev);
      final msg = e.response?.data;
      String text = '检录状态保存失败';
      if (msg is Map && msg['message'] != null) {
        final m = msg['message'];
        text = m is List ? m.join(', ') : m.toString();
      } else if (e.message != null) {
        text = e.message!;
      }
      if (mounted) Get.snackbar('检录', text);
    } catch (e) {
      setState(() => _checked[studentId] = prev);
      if (mounted) Get.snackbar('检录', e.toString());
    }
  }

  Future<void> _showScoreDialog() async {
    final taskId = _taskId;
    if (taskId == null) return;
    if (_students.isEmpty) {
      Get.snackbar('提示', '没有可录入成绩的学生');
      return;
    }

    int? selStudentId = _students.first.studentId;
    String project = kScoreProjectOptions.first;
    final resultCtrl = TextEditingController();
    final unitCtrl = TextEditingController(text: '次');

    await showDialog<void>(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setD) {
            return AlertDialog(
              title: const Text('成绩录入'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    DropdownButtonFormField<int>(
                      value: selStudentId,
                      decoration: const InputDecoration(labelText: '学生'),
                      items: _students
                          .map(
                            (s) => DropdownMenuItem(
                              value: s.studentId,
                              child: Text(
                                s.name,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          )
                          .toList(),
                      onChanged: (v) => setD(() => selStudentId = v),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: project,
                      decoration: const InputDecoration(labelText: '项目'),
                      items: kScoreProjectOptions
                          .map(
                            (p) => DropdownMenuItem(value: p, child: Text(p)),
                          )
                          .toList(),
                      onChanged: (v) {
                        if (v != null) setD(() => project = v);
                      },
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: resultCtrl,
                      decoration: const InputDecoration(
                        labelText: '成绩',
                        hintText: '如：42',
                      ),
                      keyboardType: TextInputType.text,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: unitCtrl,
                      decoration: const InputDecoration(
                        labelText: '单位',
                        hintText: '如：次、秒、米',
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('取消'),
                ),
                FilledButton(
                  onPressed: () async {
                    final sid = selStudentId;
                    if (sid == null) return;
                    final result = resultCtrl.text.trim();
                    final unit = unitCtrl.text.trim();
                    if (result.isEmpty || unit.isEmpty) {
                      Get.snackbar('提示', '请填写成绩与单位');
                      return;
                    }
                    try {
                      await Http.dio.post(
                        '/scores',
                        data: {
                          'taskId': taskId,
                          'studentId': sid,
                          'project': project,
                          'result': result,
                          'unit': unit,
                        },
                      );
                      if (ctx.mounted) Navigator.pop(ctx);
                      if (mounted) {
                        Get.snackbar('成功', '成绩已提交');
                      }
                    } on DioException catch (e) {
                      final msg = e.response?.data;
                      String text = '提交失败';
                      if (msg is Map && msg['message'] != null) {
                        final m = msg['message'];
                        text = m is List ? m.join(', ') : m.toString();
                      } else if (e.message != null) {
                        text = e.message!;
                      }
                      Get.snackbar('成绩录入', text);
                    } catch (e) {
                      Get.snackbar('成绩录入', e.toString());
                    }
                  },
                  child: const Text('提交'),
                ),
              ],
            );
          },
        );
      },
    ).whenComplete(() {
      resultCtrl.dispose();
      unitCtrl.dispose();
    });
  }

  @override
  Widget build(BuildContext context) {
    final taskId = _taskId;

    return Scaffold(
      appBar: AppBar(title: Text(_taskName)),
      body: taskId == null
          ? const Center(child: Text('缺少 taskId'))
          : LoadStateView(
              loading: _loading,
              error: _error,
              isEmpty: _students.isEmpty,
              emptyText: '任务未关联班级或班级下暂无学生',
              onRefresh: _loadAll,
              child: ListView.separated(
                itemCount: _students.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (_, i) {
                  final s = _students[i];
                  final checked = _checked[s.studentId] ?? false;
                  return ListTile(
                    title: Text(s.name),
                    subtitle: Text('学生 #${s.studentId}'),
                    trailing: Switch(
                      value: checked,
                      onChanged: (v) => _setChecked(s.studentId, v),
                    ),
                  );
                },
              ),
            ),
      bottomNavigationBar: taskId == null
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: FilledButton(
                  onPressed: _loading ? null : _showScoreDialog,
                  child: const Text('成绩录入'),
                ),
              ),
            ),
    );
  }
}
