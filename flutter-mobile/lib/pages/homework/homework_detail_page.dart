import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../utils/http.dart';
import '../../widgets/load_state_view.dart';

class HomeworkDetailPage extends StatefulWidget {
  const HomeworkDetailPage({super.key});

  @override
  State<HomeworkDetailPage> createState() => _HomeworkDetailPageState();
}

class _HomeworkDetailPageState extends State<HomeworkDetailPage> {
  bool _loading = false;
  String? _error;
  Map<String, dynamic> _homework = const {};

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    final args = (Get.arguments ?? <String, dynamic>{}) as Map<String, dynamic>;
    final id = args['id'];
    if (id == null) {
      setState(() => _error = '缺少作业ID');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await Http.dio.get('/homework/$id');
      _homework = res.data as Map<String, dynamic>? ?? const {};
    } catch (_) {
      _error = '作业详情加载失败';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('作业详情')),
      body: LoadStateView(
        loading: _loading,
        error: _error,
        isEmpty: _homework.isEmpty,
        emptyText: '暂无作业详情',
        onRefresh: _loadDetail,
        child: ListView(
          children: [
            ListTile(title: const Text('标题'), trailing: Text('${_homework['title'] ?? '-'}')),
            ListTile(title: const Text('截止时间'), trailing: Text('${_homework['deadline'] ?? '-'}')),
            ListTile(title: const Text('描述'), subtitle: Text('${_homework['description'] ?? '-'}')),
          ],
        ),
      ),
    );
  }
}
