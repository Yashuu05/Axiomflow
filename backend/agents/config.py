from typing import Optional, Literal
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class AgentSettings(BaseSettings):
    """
    Centralized configuration for Agents and Workflow Execution.
    Supports provider independence across Gemini, Groq, and Ollama.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Default LLM Provider Settings
    DEFAULT_LLM_PROVIDER: Literal["gemini", "groq", "ollama"] = Field(
        default="gemini",
        description="Default model provider to use if not overridden per agent/task"
    )
    DEFAULT_MODEL_NAME: str = Field(
        default="gemini-3.8-flash",
        description="Default model identifier"
    )
    DEFAULT_TEMPERATURE: float = Field(
        default=0.2,
        ge=0.0,
        le=2.0,
        description="Default sampling temperature"
    )

    # Provider API Keys & Base URLs
    GEMINI_API_KEY: Optional[str] = Field(default=None, description="Google Gemini API key")
    GROQ_API_KEY: Optional[str] = Field(default=None, description="Groq API key")
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434", description="Ollama API base URL")

    # Workflow Execution Limits & Policies
    MAX_PLAN_STEPS: int = Field(default=10, description="Maximum allowed steps in a generated plan")
    MAX_TOOL_RETRIES: int = Field(default=3, description="Maximum retries for transient tool execution errors")
    REQUIRE_APPROVAL_FOR_EXTERNAL_SEND: bool = Field(
        default=True,
        description="Enforce human approval before executing email sending or broad edits"
    )

    # Observability & Checkpointing
    ENABLE_AUDIT_LOGGING: bool = Field(default=True, description="Record node transitions and tool outcomes")

# Singleton instance
settings = AgentSettings()
