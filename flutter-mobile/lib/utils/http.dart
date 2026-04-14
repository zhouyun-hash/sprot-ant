import 'package:dio/dio.dart';
import 'package:get/get.dart' hide Response;

import '../store/user_store.dart';

class Http {
  static const String _apiBaseFromEnv =
      String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:3000');

  /// 与 [dio] 一致的 API 根地址，去掉末尾 `/`，供 Socket 等使用。
  static String normalizedBaseUrl() =>
      _apiBaseFromEnv.replaceAll(RegExp(r'/$'), '');

  static final Dio dio = Dio(
    BaseOptions(
      baseUrl: _apiBaseFromEnv,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      responseType: ResponseType.json,
    ),
  )
    ..interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final token = Get.find<UserStore>().token.value;
          if (token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            await Get.find<UserStore>().logout();
            Get.offAllNamed('/login');
          }
          handler.next(error);
        },
      ),
    );
}
