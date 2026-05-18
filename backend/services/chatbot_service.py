import os
import json

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except Exception:
    OPENAI_AVAILABLE = False


SYSTEM_PROMPT = (
    "You are NutriCare, an expert clinical nutritionist and registered dietitian. "
    "Answer user questions about nutrition, meal planning, dietary restrictions, allergies, "
    "weight management, and healthy lifestyles. Provide clear, evidence-based, practical "
    "and empathetic guidance. Ask clarifying questions when needed. Never provide prescriptive "
    "medical treatment; recommend consulting a healthcare professional when appropriate. "
    "Keep answers concise and actionable. Always respond in the same language as the user.\n\n"
    "IMPORTANT: You MUST respond in JSON format with EXACTLY the following structure:\n"
    "{\n"
    "  \"response\": \"Your main answer to the patient's message\",\n"
    "  \"suggestions\": [\"Question 1?\", \"Question 2?\", \"Question 3?\"]\n"
    "}\n"
    "The suggestions should be 2 to 3 short follow-up questions the patient could ask based on your response."
)


class ChatbotService:
    def __init__(self):
        self._client = None
        self._cached_key = None

    @property
    def model(self) -> str:
        return os.getenv('OPENAI_MODEL', 'gpt-4o-mini')

    def _get_client(self):
        key = os.getenv('OPENAI_API_KEY')
        if not OPENAI_AVAILABLE or not key:
            return None
        if self._client is None or self._cached_key != key:
            try:
                self._client = OpenAI(api_key=key)
                self._cached_key = key
            except Exception:
                self._client = None
        return self._client

    def is_configured(self) -> bool:
        return self._get_client() is not None

    def reply(self, user_message: str, history: list[dict] | None = None) -> dict:
        client = self._get_client()
        if not client:
            raise RuntimeError('OpenAI client not configured (missing package or API key)')

        messages = [{'role': 'system', 'content': SYSTEM_PROMPT}]
        if history:
            trimmed = history[-4:] if len(history) > 4 else history
            for m in trimmed:
                messages.append({'role': m.get('role', 'user'), 'content': m.get('content', '')})
        messages.append({'role': 'user', 'content': user_message})

        response = client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.7,
            max_tokens=700,
            response_format={'type': 'json_object'},
        )
        raw = response.choices[0].message.content or ''
        try:
            parsed = json.loads(raw)
            return {
                'reply': (parsed.get('response') or '').strip() or "Désolé, je n'ai pas pu formuler ma réponse.",
                'suggestions': parsed.get('suggestions') or [],
            }
        except json.JSONDecodeError:
            return {'reply': raw.strip(), 'suggestions': []}


_chatbot = ChatbotService()


def get_reply(user_message: str, history: list[dict] | None = None) -> dict:
    return _chatbot.reply(user_message, history)


def is_configured() -> bool:
    return _chatbot.is_configured()
