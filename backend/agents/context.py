from contextvars import ContextVar

from config import DEFAULT_USER_ID


_agent_user_id: ContextVar[str] = ContextVar("agent_user_id", default=DEFAULT_USER_ID)


def set_agent_user_id(user_id: str | None):
    return _agent_user_id.set(user_id or DEFAULT_USER_ID)


def reset_agent_user_id(token) -> None:
    _agent_user_id.reset(token)


def get_agent_user_id() -> str:
    return _agent_user_id.get()
