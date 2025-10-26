from fastapi import FastAPI, BackgroundTasks, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import asyncio
import uuid
import time

app = FastAPI(title="Mock Interview Backend")

# Allow dev frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory stores (replace with persistent DB/Supabase in prod)
JOBS: Dict[str, Dict[str, Any]] = {}
SESSIONS: Dict[str, Dict[str, Any]] = {}
MESSAGES: Dict[str, List[Dict[str, Any]]] = {}

# sessionId -> list of asyncio.Queue for SSE subscribers
SESSION_QUEUES: Dict[str, List[asyncio.Queue]] = {}


class MockGenerateIn(BaseModel):
    companyUrl: str
    jobTitle: Optional[str] = None
    resumeText: Optional[str] = None


class MockJobOut(BaseModel):
    id: str
    jobTitle: Optional[str]
    company: Dict[str, Any]
    status: str
    summary: Optional[str]
    questions: Optional[List[Dict[str, Any]]]


class MessageIn(BaseModel):
    text: str
    audioStoragePath: Optional[str] = None


@app.post("/api/mocks/generate", status_code=202)
async def generate_mock(payload: MockGenerateIn, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    job = {
        "id": job_id,
        "jobTitle": payload.jobTitle or "",
        "company": {"domain": payload.companyUrl},
        "status": "pending",
        "summary": None,
        "questions": [],
        "created_at": time.time(),
    }
    JOBS[job_id] = job

    # schedule background processing
    background_tasks.add_task(_process_mock_job, job_id, payload.dict())

    return JSONResponse({"jobId": job_id, "status": "pending", "pollUrl": f"/api/mocks/{job_id}"}, status_code=202)


async def _process_mock_job(job_id: str, payload: dict):
    # Simulate scraping + LLM (Claude) work
    await asyncio.sleep(1)
    job = JOBS.get(job_id)
    if not job:
        return
    # Create fake summary and questions. Replace with Claude calls.
    summary = f"AI-generated summary for {payload.get('companyUrl')} - role: {payload.get('jobTitle')}"
    questions = [
        {"id": str(uuid.uuid4()), "question": "Tell me about a time you optimized a web app for speed.", "why": "Performance skills.", "tips": "Mention Lighthouse metrics"},
        {"id": str(uuid.uuid4()), "question": "How do you handle disagreements on technical decisions?", "why": "Collaboration.", "tips": "Use STAR method"},
    ]
    job.update({"status": "done", "summary": summary, "questions": questions, "updated_at": time.time()})
    JOBS[job_id] = job


@app.get("/api/mocks/{job_id}")
async def get_mock(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.post("/api/interviews", status_code=201)
async def create_session(body: dict):
    session_id = str(uuid.uuid4())
    session = {
        "id": session_id,
        "jobId": body.get("jobId"),
        "status": "active",
        "created_at": time.time(),
    }
    SESSIONS[session_id] = session
    MESSAGES[session_id] = []
    SESSION_QUEUES[session_id] = []
    return {"sessionId": session_id, "streamUrl": f"/api/interviews/{session_id}/stream"}


@app.get("/api/interviews/{session_id}/messages")
async def get_messages(session_id: str):
    if session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"messages": MESSAGES.get(session_id, [])}


@app.post("/api/interviews/{session_id}/messages", status_code=202)
async def post_message(session_id: str, payload: MessageIn, background_tasks: BackgroundTasks):
    if session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")
    msg = {"id": str(uuid.uuid4()), "role": "user", "text": payload.text, "meta": {"audio": payload.audioStoragePath}, "created_at": time.time()}
    MESSAGES[session_id].append(msg)

    # Enqueue assistant response simulation
    background_tasks.add_task(_assistant_respond, session_id, payload.text)

    return {"status": "accepted", "streamUrl": f"/api/interviews/{session_id}/stream"}


async def _assistant_respond(session_id: str, user_text: str):
    # Simulate streaming tokens/deltas to connected clients
    # Break the response into chunks and push to session queues
    assistant_text = f"Simulated assistant response to: {user_text}"
    chunks = [assistant_text[:len(assistant_text)//2], assistant_text[len(assistant_text)//2:]]

    for chunk in chunks:
        await _broadcast(session_id, {"event": "assistant.delta", "data": {"text": chunk}})
        await asyncio.sleep(0.6)

    # final
    final_msg = {"id": str(uuid.uuid4()), "role": "assistant", "text": assistant_text, "created_at": time.time()}
    MESSAGES[session_id].append(final_msg)
    await _broadcast(session_id, {"event": "assistant.complete", "data": final_msg})


async def _broadcast(session_id: str, message: dict):
    queues = SESSION_QUEUES.get(session_id, [])
    for q in list(queues):
        try:
            await q.put(message)
        except asyncio.QueueFull:
            # drop
            pass


@app.get("/api/interviews/{session_id}/stream")
async def stream_events(request: Request, session_id: str):
    if session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")

    q: asyncio.Queue = asyncio.Queue()
    SESSION_QUEUES.setdefault(session_id, []).append(q)

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    msg = await asyncio.wait_for(q.get(), timeout=15.0)
                except asyncio.TimeoutError:
                    # keep-alive
                    yield "event: keepalive\n\n"
                    continue
                # format SSE event
                ev = msg.get("event", "message")
                data = msg.get("data")
                yield f"event: {ev}\n"
                yield f"data: {JSONResponse(content=data).body.decode()}\n\n"
        finally:
            # cleanup queue
            try:
                SESSION_QUEUES[session_id].remove(q)
            except Exception:
                pass

    return StreamingResponse(event_generator(), media_type="text/event-stream")


class PresignIn(BaseModel):
    sessionId: str
    contentType: str
    filename: str


@app.post("/api/uploads/presign")
async def presign_upload(body: PresignIn):
    # In production, use Supabase Storage service to create a presigned URL.
    # Here we return a placeholder URL and storage path.
    storage_path = f"uploads/{body.sessionId}/{body.filename}"
    upload_url = f"https://example.storage.local/{storage_path}?signature=stub"
    recording_id = str(uuid.uuid4())
    return {"uploadUrl": upload_url, "storagePath": storage_path, "recordingId": recording_id}
*** End Patch