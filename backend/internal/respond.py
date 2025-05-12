from typing import Any, Optional

from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
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
    response_content = ResponseModel(status=status, message=message, data=data)
    return JSONResponse(status_code=status_code, content=jsonable_encoder(response_content))
