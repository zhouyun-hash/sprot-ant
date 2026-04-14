import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../utils/http.dart';
import '../../widgets/base_list_page.dart';
import '../../widgets/load_state_view.dart';

class HomeworkPage extends StatefulWidget {
  const HomeworkPage({super.key});

  @override
  State<HomeworkPage> createState() => _HomeworkPageState();
}

class _HomeworkPageState extends State<HomeworkPage> {
  bool _loading = false;
  String? _error;
  List<dynamic> _items = const [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final Response res = await Http.dio.get('/homework', queryParameters: {'page': 1, 'pageSize': 10});
      final data = res.data as Map<String, dynamic>? ?? {};
      setState(() => _items = (data['items'] as List?) ?? const []);
    } catch (_) {
      setState(() => _error = '作业列表加载失败');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return LoadStateView(
      loading: _loading,
      error: _error,
      isEmpty: _items.isEmpty,
      emptyText: '暂无作业',
      onRefresh: _loadData,
      child: BaseListPage<dynamic>(
        items: _items,
        itemBuilder: (_, item, __) {
          final data = item as Map<String, dynamic>;
          return ListTile(
            title: Text(data['title']?.toString() ?? '未命名作业'),
            subtitle: Text('截止：${data['deadline'] ?? '-'}'),
            onTap: () => Get.toNamed('/homework/detail', arguments: data),
          );
        },
      ),
    );
  }
}
