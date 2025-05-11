from typing import Any, Optional

from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ResponseModel(BaseModel):
    status: str
    message: Optional[str] = None
    data: Optional[Any] = None


def respond_http(
    status_code: int,
    status: str,
    message: Optional[str] = None,
    data: Optional[Any] = None,
) -> JSONResponse:
    response = ResponseModel(status=status, message=message, data=data)
    return JSONResponse(status_code=status_code, content=response.dict())
