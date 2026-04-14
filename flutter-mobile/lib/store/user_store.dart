import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/user.dart';

class UserStore extends GetxController {
  final token = ''.obs;
  final user = Rxn<UserModel>();

  Future<void> restoreToken() async {
    final prefs = await SharedPreferences.getInstance();
    token.value = prefs.getString('token') ?? '';
  }

  Future<void> setAuth({
    required String tokenValue,
    UserModel? userValue,
  }) async {
    token.value = tokenValue;
    user.value = userValue;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', tokenValue);
  }

  Future<void> logout() async {
    token.value = '';
    user.value = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }
}
