import 'package:flutter/material.dart';

import '../classroom/classroom_page.dart';
import '../homework/homework_page.dart';
import '../mine/mine_page.dart';
import '../test/test_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _index = 0;

  final _tabs = const [
    ClassroomPage(),
    TestPage(),
    HomeworkPage(),
    MinePage(),
  ];

  static const _titles = ['课堂教学', '体测', '作业', '我的'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_titles[_index])),
      body: _tabs[_index],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.menu_book), label: '课堂教学'),
          BottomNavigationBarItem(icon: Icon(Icons.fitness_center), label: '体测'),
          BottomNavigationBarItem(icon: Icon(Icons.assignment), label: '作业'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: '我的'),
        ],
      ),
    );
  }
}
