from typing import Optional, Any
from langchain_core.language_models.chat_models import BaseChatModel
from agents.config import settings

def get_chat_model(
    provider: Optional[str] = None,
    model_name: Optional[str] = None,
    temperature: Optional[float] = None,
    **kwargs: Any
) -> BaseChatModel:
    """
    Central factory function returning a configured LangChain ChatModel instance.
    Decouples agent and node definitions from model providers (Gemini, Groq, Ollama).
    """
    selected_provider = (provider or settings.DEFAULT_LLM_PROVIDER).lower()
    selected_temp = temperature if temperature is not None else settings.DEFAULT_TEMPERATURE

    if selected_provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        target_model = model_name or settings.DEFAULT_MODEL_NAME or "gemini-3.6-flash"
        api_key = kwargs.get("api_key") or settings.GEMINI_API_KEY
        return ChatGoogleGenerativeAI(
            model=target_model,
            google_api_key=api_key,
            temperature=selected_temp,
            **{k: v for k, v in kwargs.items() if k != "api_key"}
        )

    elif selected_provider == "groq":
        from langchain_groq import ChatGroq
        target_model = model_name or "openai/gpt-oss-20b"
        api_key = kwargs.get("api_key") or settings.GROQ_API_KEY
        return ChatGroq(
            model_name=target_model,
            groq_api_key=api_key,
            temperature=selected_temp,
            **{k: v for k, v in kwargs.items() if k != "api_key"}
        )

    elif selected_provider == "ollama":
        from langchain_ollama import ChatOllama
        target_model = model_name or "qwen3:8b"
        base_url = kwargs.get("base_url") or settings.OLLAMA_BASE_URL
        return ChatOllama(
            model=target_model,
            base_url=base_url,
            temperature=selected_temp,
            **{k: v for k, v in kwargs.items() if k not in ("base_url",)}
        )

    else:
        raise ValueError(
            f"Unsupported LLM provider: '{selected_provider}'. "
            f"Supported providers are 'gemini', 'groq', 'ollama'."
        )
