from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .rag_service import ask_question


app = FastAPI(
    title="P'Din-Dang RAG API",
    version="1.0.0",
)


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "dindang-rag",
    }


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):

    try:
        result = ask_question(request.question)

        return result

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:
        print(f"RAG error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Failed to process chatbot request",
        )