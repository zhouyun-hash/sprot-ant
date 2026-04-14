import 'package:flutter/material.dart';

class LoadStateView extends StatelessWidget {
  final bool loading;
  final String? error;
  final bool isEmpty;
  final String emptyText;
  final Future<void> Function() onRefresh;
  final Widget child;

  const LoadStateView({
    super.key,
    required this.loading,
    required this.error,
    required this.isEmpty,
    required this.emptyText,
    required this.onRefresh,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    if (error != null) return Center(child: Text(error!));
    if (isEmpty) {
      return RefreshIndicator(
        onRefresh: onRefresh,
        child: ListView(
          children: [
            SizedBox(height: MediaQuery.of(context).size.height * 0.3),
            Center(child: Text(emptyText)),
          ],
        ),
      );
    }
    return RefreshIndicator(onRefresh: onRefresh, child: child);
  }
}
