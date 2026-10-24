import os
import sys
import logging
from typing import Optional, Any, List, Dict, Generator, Type
from pydantic import BaseModel
from langchain_core.messages import BaseMessage
from langchain_core.language_models.chat_models import BaseChatModel

from dotenv import load_dotenv

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
root_path = os.path.abspath(os.path.join(backend_path, ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Load environment variables from project root .env
load_dotenv(os.path.join(root_path, ".env"))
load_dotenv(os.path.join(backend_path, ".env"))

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", line_buffering=True)
    except Exception:
        pass

from agents.config import settings

# Setup logging
logger = logging.getLogger("axiomflow.model_factory")
if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("[%(asctime)s] [%(levelname)s] %(message)s", "%Y-%m-%d %H:%M:%S"))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


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
        target_model = model_name or settings.DEFAULT_MODEL_NAME or "gemini-3.8-flash"
        api_key = kwargs.get("api_key") or os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
        return ChatGoogleGenerativeAI(
            model=target_model,
            google_api_key=api_key,
            temperature=selected_temp,
            max_retries=1,  # Fail fast on 429 quota exhaustion to trigger Layer 2 fallback immediately
            timeout=15.0,
            **{k: v for k, v in kwargs.items() if k not in ("api_key", "google_api_key", "max_retries", "timeout")}
        )

    elif selected_provider == "groq":
        from langchain_groq import ChatGroq
        target_model = model_name or settings.DEFAULT_MODEL_NAME or "openai/gpt-oss-120b"
        api_key = kwargs.get("api_key") or os.getenv("GROQ_API_KEY") or settings.GROQ_API_KEY
        return ChatGroq(
            model_name=target_model,
            groq_api_key=api_key,
            temperature=selected_temp,
            max_tokens=4096,
            **{k: v for k, v in kwargs.items() if k not in ("api_key", "groq_api_key", "max_tokens")}
        )

    elif selected_provider == "ollama":
        from langchain_ollama import ChatOllama
        target_model = model_name or "qwen3:8b"
        base_url = kwargs.get("base_url") or os.getenv("OLLAMA_BASE_URL") or settings.OLLAMA_BASE_URL
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


class FallbackStructuredOutputWrapper:
    """
    Wraps structured output invocations with multi-layer fallback.
    """
    def __init__(self, fallback_model: "ResilientChatModel", schema: Type[BaseModel], **structured_kwargs: Any):
        self.fallback_model = fallback_model
        self.schema = schema
        self.structured_kwargs = structured_kwargs

    def invoke(self, messages: Any, **kwargs: Any) -> Any:
        errors_encountered = []
        for idx, (provider, model_name) in enumerate(self.fallback_model.layer_configs):
            layer_num = idx + 1
            try:
                chat_model = get_chat_model(
                    provider=provider,
                    model_name=model_name,
                    temperature=self.fallback_model.temperature
                )
                if provider == "groq":
                    import json
                    try:
                        structured_llm = chat_model.with_structured_output(self.schema, **self.structured_kwargs)
                        result = structured_llm.invoke(messages, **kwargs)
                        return result
                    except Exception as groq_err:
                        failed_gen = None
                        if hasattr(groq_err, "body") and isinstance(groq_err.body, dict):
                            failed_gen = groq_err.body.get("error", {}).get("failed_generation")
                        if not failed_gen and hasattr(groq_err, "response"):
                            try:
                                r_json = groq_err.response.json()
                                failed_gen = r_json.get("error", {}).get("failed_generation")
                            except Exception:
                                pass
                        if not failed_gen:
                            # Try string extraction from error message
                            import re
                            m_err = re.search(r"'failed_generation':\s*['\"](.*?)['\"]\s*\}\s*\}", str(groq_err), re.DOTALL)
                            if m_err:
                                failed_gen = m_err.group(1).encode().decode('unicode_escape')

                        if failed_gen:
                            import re
                            # 1. First attempt: check for ```json { ... } ``` code fences
                            fence_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', failed_gen, re.DOTALL)
                            if fence_match:
                                try:
                                    parsed = json.loads(fence_match.group(1))
                                    return self.schema.model_validate(parsed)
                                except Exception:
                                    pass

                            # 2. Second attempt: strip markdown and parse JSON block
                            cleaned_gen = re.sub(r'```(?:json)?\s*', '', failed_gen)
                            cleaned_gen = re.sub(r'```\s*', '', cleaned_gen)
                            match = re.search(r'\{.*\}', cleaned_gen, re.DOTALL)
                            if match:
                                try:
                                    parsed = json.loads(match.group(0))
                                    if "arguments" in parsed:
                                        p_args = parsed["arguments"]
                                        if isinstance(p_args, str):
                                            p_args = re.sub(r'```(?:json)?\s*', '', p_args)
                                            p_args = re.sub(r'```\s*', '', p_args)
                                            p_args = json.loads(p_args)
                                        return self.schema.model_validate(p_args)
                                    return self.schema.model_validate(parsed)
                                except Exception:
                                    pass
                        raise groq_err

                structured_llm = chat_model.with_structured_output(self.schema, **self.structured_kwargs)
                result = structured_llm.invoke(messages, **kwargs)
                return result
            except Exception as e:
                err_type = e.__class__.__name__
                err_msg = str(e)
                errors_encountered.append(f"Layer {layer_num} ({model_name}): {err_type} - {err_msg}")

                next_layer = layer_num + 1
                if next_layer <= len(self.fallback_model.layer_configs):
                    next_provider, next_model = self.fallback_model.layer_configs[idx + 1]
                    alert_msg = (
                        f"[LLM FALLBACK ALERT] {model_name} {err_type}: {err_msg}. "
                        f"Using Layer {next_layer} Model ({next_model} via {next_provider}) for task execution."
                    )
                    print(f"\n\033[93m{alert_msg}\033[0m\n", flush=True)
                    logger.warning(alert_msg)
                    self.fallback_model.fallback_logs.append({
                        "failed_layer": layer_num,
                        "failed_model": model_name,
                        "error_type": err_type,
                        "error_message": err_msg,
                        "fallback_to_layer": next_layer,
                        "fallback_model": next_model
                    })
                else:
                    critical_msg = f"[LLM FATAL] All {len(self.fallback_model.layer_configs)} model fallback layers exhausted."
                    print(f"\n\033[91m{critical_msg}\033[0m\n", flush=True)
                    logger.error(critical_msg)

        raise RuntimeError(f"All model fallback layers exhausted: {'; '.join(errors_encountered)}")


class ResilientChatModel:
    """
    Production-ready Multi-Layer Fallback Chat Model.
    Layer 1: OpenAI GPT-OSS 120B (via langchain-groq)
    Layer 2: Google Gemini 3.8 Flash (via langchain-google-genai)
    Layer 3: Qwen 3:8B (via langchain-ollama)
    
    Catches rate limits, resource exhaustion, quota errors, and API timeouts.
    Logs explicit user-facing fallback notices and maintains an audit trail.
    """
    def __init__(
        self,
        temperature: float = 0.2,
        custom_layers: Optional[List[tuple]] = None
    ):
        self.temperature = temperature
        self.layer_configs = custom_layers or [
            ("groq", "openai/gpt-oss-120b"),
            ("gemini", "gemini-3.8-flash"),
            ("groq", "qwen/qwen3.8-27b"),
            ("groq", "openai/gpt-oss-20b"),
            ("ollama", "qwen3:8b")
        ]
        self.fallback_logs: List[Dict[str, Any]] = []

    def with_structured_output(self, schema: Type[BaseModel], **kwargs: Any) -> FallbackStructuredOutputWrapper:
        """Returns structured output wrapper with fallback capability."""
        return FallbackStructuredOutputWrapper(self, schema, **kwargs)

    def invoke(self, messages: Any, **kwargs: Any) -> Any:
        """Executes prompt across layers until success."""
        errors_encountered = []
        for idx, (provider, model_name) in enumerate(self.layer_configs):
            layer_num = idx + 1
            try:
                chat_model = get_chat_model(
                    provider=provider,
                    model_name=model_name,
                    temperature=self.temperature
                )
                return chat_model.invoke(messages, **kwargs)
            except Exception as e:
                err_type = e.__class__.__name__
                err_msg = str(e)
                errors_encountered.append(f"Layer {layer_num} ({model_name}): {err_type} - {err_msg}")

                next_layer = layer_num + 1
                if next_layer <= len(self.layer_configs):
                    next_provider, next_model = self.layer_configs[idx + 1]
                    alert_msg = (
                        f"[LLM FALLBACK ALERT] {model_name} {err_type}: {err_msg}. "
                        f"Using Layer {next_layer} Model ({next_model} via {next_provider}) for task execution."
                    )
                    print(f"\n\033[93m{alert_msg}\033[0m\n", flush=True)
                    logger.warning(alert_msg)
                    self.fallback_logs.append({
                        "failed_layer": layer_num,
                        "failed_model": model_name,
                        "error_type": err_type,
                        "error_message": err_msg,
                        "fallback_to_layer": next_layer,
                        "fallback_model": next_model
                    })
                else:
                    critical_msg = f"[LLM FATAL] All {len(self.layer_configs)} model fallback layers exhausted."
                    print(f"\n\033[91m{critical_msg}\033[0m\n", flush=True)
                    logger.error(critical_msg)

        raise RuntimeError(f"All model fallback layers exhausted: {'; '.join(errors_encountered)}")

    def stream(self, messages: Any, **kwargs: Any) -> Generator[Any, None, None]:
        """Streams response with fallback to subsequent layers if streaming fails."""
        for idx, (provider, model_name) in enumerate(self.layer_configs):
            layer_num = idx + 1
            try:
                chat_model = get_chat_model(
                    provider=provider,
                    model_name=model_name,
                    temperature=self.temperature
                )
                stream_gen = chat_model.stream(messages, **kwargs)
                # Test first token to verify stream viability
                first_chunk = next(stream_gen, None)
                if first_chunk is not None:
                    yield first_chunk
                for chunk in stream_gen:
                    yield chunk
                return
            except Exception as e:
                err_type = e.__class__.__name__
                err_msg = str(e)
                next_layer = layer_num + 1
                if next_layer <= len(self.layer_configs):
                    next_provider, next_model = self.layer_configs[idx + 1]
                    alert_msg = (
                        f"[LLM FALLBACK ALERT] {model_name} {err_type}: {err_msg}. "
                        f"Using Layer {next_layer} Model ({next_model} via {next_provider}) for task execution."
                    )
                    print(f"\n\033[93m{alert_msg}\033[0m\n", flush=True)
                    logger.warning(alert_msg)
                    self.fallback_logs.append({
                        "failed_layer": layer_num,
                        "failed_model": model_name,
                        "error_type": err_type,
                        "error_message": err_msg,
                        "fallback_to_layer": next_layer,
                        "fallback_model": next_model
                    })
                else:
                    raise


def get_resilient_chat_model(temperature: float = 0.2) -> ResilientChatModel:
    """Convenience factory returning a ResilientChatModel instance."""
    return ResilientChatModel(temperature=temperature)
