import json
from io import BytesIO
from types import SimpleNamespace
from unittest.mock import patch
from urllib.error import HTTPError

from django.test import SimpleTestCase, override_settings
from rest_framework.test import APIRequestFactory, force_authenticate

from qlmvt.views.chatbot import (
    _available_tools,
    _change_request_guidance,
    _explicit_export_request,
    _run_tool,
    _search_employees,
    _search_incidents,
    _search_vulnerabilities,
    api_chatbot_ask,
)


class FakeProviderResponse:
    def __init__(self, data=None):
        self.data = data or {
            "choices": [{"message": {"content": "Xin chào!"}}]
        }

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return None

    def read(self):
        return json.dumps(self.data).encode("utf-8")


class ChatbotApiTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def request(self, payload, is_staff=False):
        request = self.factory.post(
            "/qlmvt/api_chatbot_ask/",
            payload,
            format="json",
        )
        force_authenticate(
            request,
            user=SimpleNamespace(is_authenticated=True, is_staff=is_staff),
        )
        return api_chatbot_ask(request)

    def test_export_requires_an_explicit_action_request(self):
        self.assertTrue(_explicit_export_request("Export a JSON backup"))
        self.assertTrue(_explicit_export_request("Xuất file backup JSON"))
        self.assertFalse(
            _explicit_export_request("I want to know how to export a backup")
        )
        self.assertFalse(_explicit_export_request("Explain how to download a backup"))
        self.assertFalse(
            _explicit_export_request("I need to know how to export a backup")
        )
        self.assertFalse(_explicit_export_request("How do I export a JSON backup?"))
        self.assertFalse(_explicit_export_request("Backup là gì?"))

    @override_settings(CHATBOT_API_KEY="")
    def test_requires_provider_configuration(self):
        response = self.request({"message": "Xin chào"})

        self.assertEqual(response.status_code, 503)
        body = json.loads(response.content)
        self.assertEqual(body["code"], "chatbot_not_configured")
        self.assertIn("CHATBOT_API_KEY", body["error"])
        self.assertIn("TelecomManagement_BE/.env", body["error"])

    @override_settings(
        CHATBOT_API_KEY="test-key",
        CHATBOT_BASE_URL="https://generativelanguage.googleapis.com/v1beta/openai/",
        CHATBOT_MODEL="gemini-3.5-flash-lite",
    )
    @patch("qlmvt.views.chatbot.urlopen")
    def test_provider_rejections_return_actionable_safe_diagnostics(self, mock_urlopen):
        cases = (
            (
                401,
                {"code": "invalid_api_key", "type": "authentication_error"},
                "Gemini",
            ),
            (
                404,
                {"code": "model_not_found", "type": "invalid_request_error", "param": "model"},
                "CHATBOT_MODEL",
            ),
            (
                429,
                {"code": "insufficient_quota", "type": "insufficient_quota"},
                "billing",
            ),
        )

        for status_code, details, expected_message in cases:
            with self.subTest(status_code=status_code):
                mock_urlopen.side_effect = HTTPError(
                    "https://api.openai.com/v1/chat/completions",
                    status_code,
                    "provider error",
                    {},
                    BytesIO(
                        json.dumps(
                            {
                                "error": {
                                    **details,
                                    "message": "provider detail must not be exposed",
                                }
                            }
                        ).encode("utf-8")
                    ),
                )
                response = self.request({"message": "Tìm nhân viên"})

                body = json.loads(response.content)
                self.assertEqual(response.status_code, 502)
                self.assertEqual(body["code"], "chatbot_provider_rejected")
                self.assertEqual(body["provider_status"], status_code)
                self.assertIn(expected_message, body["error"])
                self.assertNotIn("OpenAI", body["error"])
                self.assertNotIn("provider detail must not be exposed", body["error"])
                if "code" in details:
                    self.assertEqual(body["provider_error_code"], details["code"])

    @override_settings(
        CHATBOT_API_KEY="test-key",
        CHATBOT_BASE_URL="https://generativelanguage.googleapis.com/v1beta/openai/",
        CHATBOT_MODEL="gemini-3.5-flash-lite",
    )
    @patch("qlmvt.views.chatbot.urlopen")
    def test_gemini_uses_compatible_chat_completions_without_sampling_params(
        self, mock_urlopen
    ):
        mock_urlopen.return_value = FakeProviderResponse()

        response = self.request({"message": "Xin chào"})

        self.assertEqual(response.status_code, 200)
        provider_request = mock_urlopen.call_args.args[0]
        self.assertEqual(
            provider_request.full_url,
            "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        )
        self.assertEqual(provider_request.get_header("Authorization"), "Bearer test-key")
        payload = json.loads(provider_request.data)
        self.assertEqual(payload["model"], "gemini-3.5-flash-lite")
        self.assertEqual(payload["tool_choice"], "auto")
        self.assertIn("tools", payload)
        self.assertNotIn("temperature", payload)

    def test_chatbot_has_no_write_tools(self):
        user = SimpleNamespace(is_staff=False)
        tools = _available_tools(user, allow_export=False)

        self.assertTrue(
            all(
                tool["function"]["name"].startswith(("get_", "search_"))
                for tool in tools
            )
        )
        with self.assertRaises(PermissionError):
            _run_tool("create_device", {}, user, allow_export=False)

    @override_settings(CHATBOT_API_KEY="")
    @patch("qlmvt.views.chatbot.urlopen")
    def test_write_requests_only_return_guidance_without_provider_call(self, mock_urlopen):
        response = self.request(
            {"message": "Please update the device status"},
            is_staff=False,
        )

        body = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(body["type"], "text")
        self.assertIn("chỉ tra cứu", body["message"])
        self.assertIn("Admin", body["message"])
        mock_urlopen.assert_not_called()

    def test_change_guidance_is_role_aware_and_understands_vietnamese(self):
        message = "Thêm thiết bị mới"

        admin_guidance = _change_request_guidance(
            SimpleNamespace(is_staff=True), message
        )
        employee_guidance = _change_request_guidance(
            SimpleNamespace(is_staff=False), message
        )

        self.assertIn("giao diện quản trị", admin_guidance)
        self.assertIn("theo quyền hiện có", employee_guidance)
        self.assertIsNotNone(
            _change_request_guidance(
                SimpleNamespace(is_staff=False), "Tôi muốn cập nhật email"
            )
        )
        self.assertIsNotNone(
            _change_request_guidance(
                SimpleNamespace(is_staff=False), "How do I add a new record?"
            )
        )

    def test_status_questions_are_not_mistaken_for_write_requests(self):
        user = SimpleNamespace(is_staff=False)

        self.assertIsNone(
            _change_request_guidance(user, "Lỗ hổng này đã sửa chưa?")
        )
        self.assertIsNone(
            _change_request_guidance(user, "Has this device been updated?")
        )

    @patch("qlmvt.views.chatbot._employee_for")
    @patch("qlmvt.views.chatbot.NhanVien.objects")
    def test_employee_lookup_is_limited_to_own_profile(
        self, mock_employees, mock_employee_for
    ):
        employee = SimpleNamespace(ma_nv=42)
        mock_employee_for.return_value = employee
        queryset = mock_employees.filter.return_value
        queryset.order_by.return_value.__getitem__.return_value = []

        _search_employees({"limit": 5}, SimpleNamespace(is_staff=False))

        mock_employees.filter.assert_called_once_with(ma_nv=42)

    @patch("qlmvt.views.chatbot._employee_for")
    @patch("qlmvt.views.chatbot.NhatKyLoi.objects")
    def test_employee_incident_lookup_is_limited_to_assigned_records(
        self, mock_incidents, mock_employee_for
    ):
        employee = SimpleNamespace(ma_nv=42)
        mock_employee_for.return_value = employee
        queryset = mock_incidents.select_related.return_value
        assigned_queryset = queryset.filter.return_value
        assigned_queryset.order_by.return_value.__getitem__.return_value = []

        _search_incidents({"limit": 5}, SimpleNamespace(is_staff=False))

        queryset.filter.assert_called_once_with(manv_xuly_id=42)

    @patch("qlmvt.views.chatbot._employee_for")
    @patch("qlmvt.views.chatbot.LoHong.objects")
    def test_employee_vulnerability_lookup_is_limited_to_assigned_records(
        self, mock_vulnerabilities, mock_employee_for
    ):
        employee = SimpleNamespace(ma_nv=42)
        mock_employee_for.return_value = employee
        queryset = mock_vulnerabilities.select_related.return_value
        assigned_queryset = queryset.filter.return_value
        assigned_queryset.order_by.return_value.__getitem__.return_value = []

        _search_vulnerabilities(
            {"limit": 5}, SimpleNamespace(is_staff=False)
        )

        queryset.filter.assert_called_once_with(manv_xuly_id=42)

    def test_rejects_invalid_history(self):
        response = self.request(
            {"message": "Xin chào", "history": [{"role": "system", "content": "no"}]}
        )

        self.assertEqual(response.status_code, 400)

    @override_settings(
        CHATBOT_API_KEY="test-key",
        CHATBOT_BASE_URL="https://ai.example/v1",
        CHATBOT_MODEL="test-model",
        CHATBOT_TIMEOUT_SECONDS=5,
    )
    @patch("qlmvt.views.chatbot.urlopen")
    def test_sends_conversation_to_openai_compatible_provider(self, mock_urlopen):
        mock_urlopen.return_value = FakeProviderResponse()

        response = self.request(
            {
                "message": "Giúp tôi",
                "history": [{"role": "model", "content": "Xin chào"}],
            }
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content)["message"], "Xin chào!")
        request = mock_urlopen.call_args.args[0]
        self.assertEqual(request.full_url, "https://ai.example/v1/chat/completions")
        self.assertEqual(request.get_header("Authorization"), "Bearer test-key")
        body = json.loads(request.data)
        self.assertEqual(body["model"], "test-model")
        self.assertEqual(body["messages"][1]["role"], "assistant")
        self.assertEqual(body["messages"][-1]["content"], "Giúp tôi")
        self.assertIn("MỌI câu trả lời luôn phải bằng tiếng Việt", body["messages"][0]["content"])

    @override_settings(
        CHATBOT_API_KEY="test-key",
        CHATBOT_BASE_URL="https://ai.example/v1",
        CHATBOT_MODEL="test-model",
        CHATBOT_TIMEOUT_SECONDS=5,
    )
    @patch("qlmvt.views.chatbot.backup_to_json", return_value='{"models":{}}')
    @patch("qlmvt.views.chatbot.urlopen")
    def test_admin_export_returns_backup_without_sending_it_to_provider(
        self, mock_urlopen, mock_backup
    ):
        mock_urlopen.return_value = FakeProviderResponse(
            {
                "choices": [
                    {
                        "message": {
                            "tool_calls": [
                                {
                                    "id": "export-1",
                                    "type": "function",
                                    "function": {
                                        "name": "export_backup_json",
                                        "arguments": "{}",
                                    },
                                }
                            ]
                        }
                    }
                ]
            }
        )

        response = self.request({"message": "Export a JSON backup"}, is_staff=True)

        body = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(body["type"], "export")
        self.assertEqual(body["file_content"], '{"models":{}}')
        self.assertEqual(body["file_name"], "qlmvt_backup.json")
        self.assertEqual(mock_urlopen.call_count, 1)
        self.assertEqual(json.loads(mock_urlopen.call_args.args[0].data)["messages"][-1]["content"], "Export a JSON backup")
        mock_backup.assert_called_once_with()

    @override_settings(
        CHATBOT_API_KEY="test-key",
        CHATBOT_BASE_URL="https://ai.example/v1",
        CHATBOT_MODEL="test-model",
        CHATBOT_TIMEOUT_SECONDS=5,
    )
    @patch("qlmvt.views.chatbot.backup_to_json")
    @patch("qlmvt.views.chatbot.urlopen")
    def test_employee_cannot_export_even_if_provider_requests_it(
        self, mock_urlopen, mock_backup
    ):
        tool_call_response = FakeProviderResponse(
            {
                "choices": [
                    {
                        "message": {
                            "tool_calls": [
                                {
                                    "id": "export-1",
                                    "type": "function",
                                    "function": {
                                        "name": "export_backup_json",
                                        "arguments": "{}",
                                    },
                                }
                            ]
                        }
                    }
                ]
            }
        )
        mock_urlopen.side_effect = [
            tool_call_response,
            FakeProviderResponse(
                {"choices": [{"message": {"content": "Chỉ Admin mới được xuất backup."}}]}
            ),
        ]

        response = self.request({"message": "Export a backup"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content)["type"], "text")
        self.assertEqual(mock_urlopen.call_count, 2)
        first_request_body = json.loads(mock_urlopen.call_args_list[0].args[0].data)
        available_tools = [
            tool["function"]["name"] for tool in first_request_body["tools"]
        ]
        self.assertNotIn("export_backup_json", available_tools)
        mock_backup.assert_not_called()
