from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from rag import ask_question


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
        "service": "p-din-dang-rag",
    }


@app.post("/ask", response_model=ChatResponse)
def ask(request: ChatRequest):

    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question is required",
        )

    try:
        result = ask_question(question)

        return ChatResponse(
            answer=result["answer"],
            sources=result["sources"],
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:
        print(f"RAG ERROR: {exc}")

        raise HTTPException(
            status_code=500,
            detail="Failed to process chatbot request",
        )