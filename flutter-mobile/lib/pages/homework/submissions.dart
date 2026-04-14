import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:video_player/video_player.dart';

import '../../utils/http.dart';
import '../../widgets/load_state_view.dart';

class HomeworkSubmissionsPage extends StatefulWidget {
  const HomeworkSubmissionsPage({super.key});

  @override
  State<HomeworkSubmissionsPage> createState() => _HomeworkSubmissionsPageState();
}

class _HomeworkSubmissionsPageState extends State<HomeworkSubmissionsPage> {
  int? _homeworkId;

  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _items = const [];

  @override
  void initState() {
    super.initState();
    _homeworkId = _parseHomeworkId();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_homeworkId != null) {
        _load();
      } else {
        setState(() {
          _loading = false;
          _error = '缺少 homeworkId';
        });
      }
    });
  }

  int? _parseHomeworkId() {
    final p = Get.parameters['homeworkId'];
    if (p != null && p.isNotEmpty) return int.tryParse(p);
    final args = Get.arguments;
    if (args is Map && args['homeworkId'] != null) {
      final v = args['homeworkId'];
      if (v is int) return v;
      if (v is num) return v.toInt();
      return int.tryParse(v.toString());
    }
    return null;
  }

  String? _resolveVideoUrl(String? raw) {
    if (raw == null || raw.trim().isEmpty) return null;
    final u = raw.trim();
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    final base = Http.normalizedBaseUrl();
    if (u.startsWith('/')) return '$base$u';
    return '$base/$u';
  }

  String _studentName(Map<String, dynamic> item) {
    final student = item['student'];
    if (student is Map) {
      final user = student['user'];
      if (user is Map) {
        final n = user['name']?.toString();
        if (n != null && n.isNotEmpty) return n;
      }
      final no = student['studentNo']?.toString();
      if (no != null && no.isNotEmpty) return no;
    }
    return '学生 ${item['studentId'] ?? ''}';
  }

  String _scoreLabel(dynamic v) {
    if (v == null) return '—';
    if (v is num) return v.toString();
    return v.toString();
  }

  Future<void> _load() async {
    final id = _homeworkId;
    if (id == null) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final Response res = await Http.dio.get('/homework/$id/submissions');
      final data = res.data as Map<String, dynamic>? ?? {};
      final raw = (data['items'] as List?) ?? const [];
      setState(() {
        _items = raw
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
      });
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

  void _playVideo(String url) {
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => _VideoPlayDialog(url: url),
    );
  }

  Future<void> _showGradeDialog(Map<String, dynamic> item) async {
    final submissionId = item['id'];
    final sid = submissionId is int
        ? submissionId
        : submissionId is num
            ? submissionId.toInt()
            : int.tryParse(submissionId?.toString() ?? '');
    if (sid == null) return;

    final currentScore = item['teacherScore'];
    final currentComment = item['comment']?.toString() ?? '';

    final scoreCtrl = TextEditingController(
      text: currentScore == null ? '' : _scoreLabel(currentScore),
    );
    final commentCtrl = TextEditingController(text: currentComment);

    await showDialog<void>(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Text('批改 · ${_studentName(item)}'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: scoreCtrl,
                  decoration: const InputDecoration(
                    labelText: '教师评分（0–100）',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: commentCtrl,
                  decoration: const InputDecoration(
                    labelText: '评语',
                    border: OutlineInputBorder(),
                    alignLabelWithHint: true,
                  ),
                  maxLines: 3,
                  maxLength: 500,
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
                final score = int.tryParse(scoreCtrl.text.trim());
                if (score == null || score < 0 || score > 100) {
                  Get.snackbar('提示', '请输入 0–100 的整数评分');
                  return;
                }
                try {
                  await Http.dio.post(
                    '/homework/submission/$sid/grade',
                    data: {
                      'teacherScore': score,
                      'comment': commentCtrl.text.trim().isEmpty
                          ? null
                          : commentCtrl.text.trim(),
                    },
                  );
                  if (ctx.mounted) Navigator.pop(ctx);
                  Get.snackbar('成功', '已保存批改');
                  await _load();
                } on DioException catch (e) {
                  final msg = e.response?.data;
                  String text = '批改失败';
                  if (msg is Map && msg['message'] != null) {
                    final m = msg['message'];
                    text = m is List ? m.join(', ') : m.toString();
                  } else if (e.message != null) {
                    text = e.message!;
                  }
                  Get.snackbar('批改', text);
                } catch (e) {
                  Get.snackbar('批改', e.toString());
                }
              },
              child: const Text('保存'),
            ),
          ],
        );
      },
    );
    scoreCtrl.dispose();
    commentCtrl.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hid = _homeworkId;

    return Scaffold(
      appBar: AppBar(title: Text('作业提交${hid != null ? ' #$hid' : ''}')),
      body: hid == null
          ? const Center(child: Text('缺少 homeworkId'))
          : LoadStateView(
              loading: _loading,
              error: _error,
              isEmpty: _items.isEmpty,
              emptyText: '暂无提交',
              onRefresh: _load,
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                itemCount: _items.length,
                itemBuilder: (_, i) {
                  final item = _items[i];
                  final name = _studentName(item);
                  final videoRaw = item['videoUrl']?.toString();
                  final playUrl = _resolveVideoUrl(videoRaw);
                  final ai = _scoreLabel(item['aiScore']);
                  final teacher = _scoreLabel(item['teacherScore']);

                  return Card(
                    margin: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(left: 4, top: 8),
                          child: IconButton(
                            tooltip: playUrl == null ? '无视频' : '播放',
                            onPressed: playUrl == null ? null : () => _playVideo(playUrl),
                            icon: Icon(
                              Icons.play_circle_outline,
                              size: 40,
                              color: playUrl == null
                                  ? Theme.of(context)
                                      .colorScheme
                                      .onSurface
                                      .withValues(alpha: 0.38)
                                  : Theme.of(context).colorScheme.primary,
                            ),
                          ),
                        ),
                        Expanded(
                          child: InkWell(
                            onTap: () => _showGradeDialog(item),
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(0, 12, 12, 12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    name,
                                    style: Theme.of(context).textTheme.titleMedium,
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    'AI 评分：$ai',
                                    style: Theme.of(context).textTheme.bodyMedium,
                                  ),
                                  Text(
                                    '教师评分：$teacher',
                                    style: Theme.of(context).textTheme.bodyMedium,
                                  ),
                                  if (videoRaw != null && videoRaw.isNotEmpty)
                                    Text(
                                      '视频已提交',
                                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                            color: Theme.of(context).colorScheme.primary,
                                          ),
                                    )
                                  else
                                    Text(
                                      '无视频',
                                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                            color: Theme.of(context).colorScheme.outline,
                                          ),
                                    ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '点击卡片批改',
                                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                          color: Theme.of(context).colorScheme.outline,
                                        ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
    );
  }
}

class _VideoPlayDialog extends StatefulWidget {
  const _VideoPlayDialog({required this.url});

  final String url;

  @override
  State<_VideoPlayDialog> createState() => _VideoPlayDialogState();
}

class _VideoPlayDialogState extends State<_VideoPlayDialog> {
  late final VideoPlayerController _controller;
  Future<void>? _init;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.url));
    _init = _controller.initialize().then((_) {
      if (mounted) setState(() {});
      return _controller.play();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('提交视频'),
      content: FutureBuilder<void>(
        future: _init,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const SizedBox(
              width: 280,
              height: 160,
              child: Center(child: CircularProgressIndicator()),
            );
          }
          if (snap.hasError) {
            return SizedBox(
              width: 280,
              child: Text('无法播放：${snap.error}'),
            );
          }
          final ar = _controller.value.aspectRatio;
          return SizedBox(
            width: 320,
            child: AspectRatio(
              aspectRatio: ar > 0 ? ar : 16 / 9,
              child: VideoPlayer(_controller),
            ),
          );
        },
      ),
      actions: [
        IconButton(
          onPressed: () {
            if (_controller.value.isPlaying) {
              _controller.pause();
            } else {
              _controller.play();
            }
            setState(() {});
          },
          icon: Icon(
            _controller.value.isPlaying ? Icons.pause : Icons.play_arrow,
          ),
        ),
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('关闭'),
        ),
      ],
    );
  }
}
