import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../utils/http.dart';
import '../../widgets/load_state_view.dart';

class ClassroomDetailPage extends StatefulWidget {
  const ClassroomDetailPage({super.key});

  @override
  State<ClassroomDetailPage> createState() => _ClassroomDetailPageState();
}

class _ClassroomDetailPageState extends State<ClassroomDetailPage> {
  bool _loading = false;
  String? _error;
  Map<String, dynamic> _task = const {};

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    final args = (Get.arguments ?? <String, dynamic>{}) as Map<String, dynamic>;
    final taskId = args['id'];
    if (taskId == null) {
      setState(() {
        _error = '缺少任务ID';
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await Http.dio.get('/tasks/$taskId');
      setState(() {
        _task = (res.data as Map<String, dynamic>? ?? const {});
      });
    } catch (_) {
      setState(() {
        _error = '任务详情加载失败';
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('课堂任务详情')),
      body: LoadStateView(
        loading: _loading,
        error: _error,
        isEmpty: _task.isEmpty,
        emptyText: '暂无任务详情',
        onRefresh: _loadDetail,
        child: ListView(
          children: [
            ListTile(title: const Text('任务名称'), trailing: Text('${_task['name'] ?? '-'}')),
            ListTile(title: const Text('类型'), trailing: Text('${_task['type'] ?? '-'}')),
            ListTile(title: const Text('状态'), trailing: Text('${_task['status'] ?? '-'}')),
            ListTile(title: const Text('开始时间'), trailing: Text('${_task['startTime'] ?? '-'}')),
            ListTile(title: const Text('结束时间'), trailing: Text('${_task['endTime'] ?? '-'}')),
          ],
        ),
      ),
    );
  }
}
