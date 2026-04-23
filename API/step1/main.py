import os, base64, json, re, time, uuid, datetime
import requests
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Header, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, Index
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from jose import jwt, JWTError
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

# ── 설정 ─────────────────────────────────────────────────────────────────────
API_KEY      = os.getenv("OPENROUTER_API_KEY", "")
JWT_SECRET   = os.getenv("JWT_SECRET", "changeme")
JWT_ALGO     = "HS256"
JWT_DAYS     = 7
VISION_MODEL = "nvidia/nemotron-nano-12b-v2-vl:free"
# 텍스트 모델: 우선순위 순서로 시도
TEXT_MODELS = [
    "openai/gpt-oss-20b:free",              # 빠름 (~3초)
    "nvidia/nemotron-3-super-120b-a12b:free", # fallback (~12초)
    "google/gemma-4-31b-it:free",            # 원래 모델 (혼잡 시 마지막 시도)
]
OR_URL       = "https://openrouter.ai/api/v1/chat/completions"
MAX_FILE     = 10 * 1024 * 1024
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}

_ph = PasswordHasher()

def _hash_pw(pw: str) -> str: return _ph.hash(pw)
def _verify_pw(pw: str, hashed: str) -> bool:
    try: return _ph.verify(hashed, pw)
    except VerifyMismatchError: return False

# ── 프롬프트 ──────────────────────────────────────────────────────────────────
RECOGNIZE_PROMPT = (
    "You are a food ingredient recognition assistant. "
    "Analyze the provided refrigerator image and list all visible food ingredients. "
    "Return ONLY a JSON array of ingredient names in Korean. "
    'Example: ["계란", "당근", "우유", "버터"] '
    "Do not include packaging, containers, or non-food items. "
    "Do not add any explanation or text outside the JSON array."
)

RECIPE_TMPL = """\
You are a professional chef and recipe recommendation assistant.
Given the following ingredients, suggest up to 3 practical Korean recipes.

Ingredients: {ingredients}
Cooking time: under {time} minutes
Difficulty: {difficulty}
Servings: {servings}{constraints}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{{
  "recipes": [
    {{
      "title": "...",
      "description": "...",
      "cooking_time": <number>,
      "difficulty": "쉬움 또는 보통 또는 어려움",
      "servings": <number>,
      "ingredients": [{{"name": "...", "amount": "..."}}],
      "steps": ["...", "..."],
      "tags": ["..."]
    }}
  ]
}}

Write all text in Korean. Output only the JSON object, nothing else.
"""

# ── 데이터베이스 ──────────────────────────────────────────────────────────────
DB_PATH = Path(__file__).parent / "app.db"
engine  = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
Session_ = sessionmaker(bind=engine)
Base    = declarative_base()

class User(Base):
    __tablename__ = "users"
    id                   = Column(String, primary_key=True)
    email                = Column(String, unique=True, nullable=False, index=True)
    password_hash        = Column(String, nullable=False)
    nickname             = Column(String, nullable=False)
    allergies            = Column(Text, default="[]")
    disliked_ingredients = Column(Text, default="[]")
    preferred_cuisine    = Column(Text, default="[]")
    default_servings     = Column(Integer, default=2)
    created_at           = Column(DateTime, default=datetime.datetime.utcnow)

class SavedRecipe(Base):
    __tablename__ = "saved_recipes"
    id          = Column(String, primary_key=True)
    user_id     = Column(String, nullable=False, index=True)
    recipe_data = Column(Text, nullable=False)
    rating      = Column(Integer, nullable=True)
    memo        = Column(Text, nullable=True)
    saved_at    = Column(DateTime, default=datetime.datetime.utcnow)

Base.metadata.create_all(engine)

def get_db():
    db = Session_()
    try:
        yield db
    finally:
        db.close()

# ── JWT 헬퍼 ─────────────────────────────────────────────────────────────────
def make_token(user_id: str) -> str:
    exp = datetime.datetime.utcnow() + datetime.timedelta(days=JWT_DAYS)
    return jwt.encode({"sub": user_id, "exp": exp}, JWT_SECRET, algorithm=JWT_ALGO)

def read_token(token: str) -> str:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])["sub"]

def require_auth(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "인증이 필요합니다.")
    try:
        uid = read_token(authorization.split(" ", 1)[1])
    except JWTError:
        raise HTTPException(401, "유효하지 않은 토큰입니다.")
    user = db.query(User).filter_by(id=uid).first()
    if not user:
        raise HTTPException(401, "사용자를 찾을 수 없습니다.")
    return user

# ── FastAPI 앱 ────────────────────────────────────────────────────────────────
app = FastAPI()

# ── Auth ──────────────────────────────────────────────────────────────────────
class SignupReq(BaseModel):
    email: str
    password: str
    nickname: str

class LoginReq(BaseModel):
    email: str
    password: str

@app.post("/api/auth/signup")
def signup(req: SignupReq, db: Session = Depends(get_db)):
    if db.query(User).filter_by(email=req.email.lower()).first():
        raise HTTPException(409, "이미 사용 중인 이메일입니다.")
    if len(req.password) < 6:
        raise HTTPException(400, "비밀번호는 6자 이상이어야 합니다.")
    if not req.nickname.strip():
        raise HTTPException(400, "닉네임을 입력해주세요.")
    user = User(
        id=str(uuid.uuid4()),
        email=req.email.lower(),
        password_hash=_hash_pw(req.password),
        nickname=req.nickname.strip(),
    )
    db.add(user)
    db.commit()
    return {"success": True, "token": make_token(user.id), "nickname": user.nickname}

@app.post("/api/auth/login")
def login(req: LoginReq, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(email=req.email.lower()).first()
    if not user or not _verify_pw(req.password, user.password_hash):
        raise HTTPException(401, "이메일 또는 비밀번호가 올바르지 않습니다.")
    return {"success": True, "token": make_token(user.id), "nickname": user.nickname}

@app.post("/api/auth/logout")
def logout():
    return {"success": True}

# ── Profile ───────────────────────────────────────────────────────────────────
class ProfileUpdate(BaseModel):
    nickname:             Optional[str]       = None
    allergies:            Optional[list[str]] = None
    disliked_ingredients: Optional[list[str]] = None
    preferred_cuisine:    Optional[list[str]] = None
    default_servings:     Optional[int]       = None

@app.get("/api/profile")
def get_profile(user: User = Depends(require_auth)):
    return {
        "email":                user.email,
        "nickname":             user.nickname,
        "allergies":            json.loads(user.allergies or "[]"),
        "disliked_ingredients": json.loads(user.disliked_ingredients or "[]"),
        "preferred_cuisine":    json.loads(user.preferred_cuisine or "[]"),
        "default_servings":     user.default_servings,
        "created_at":           user.created_at.isoformat() if user.created_at else None,
    }

@app.put("/api/profile")
def update_profile(req: ProfileUpdate, user: User = Depends(require_auth), db: Session = Depends(get_db)):
    if req.nickname             is not None: user.nickname             = req.nickname
    if req.allergies            is not None: user.allergies            = json.dumps(req.allergies, ensure_ascii=False)
    if req.disliked_ingredients is not None: user.disliked_ingredients = json.dumps(req.disliked_ingredients, ensure_ascii=False)
    if req.preferred_cuisine    is not None: user.preferred_cuisine    = json.dumps(req.preferred_cuisine, ensure_ascii=False)
    if req.default_servings     is not None: user.default_servings     = req.default_servings
    db.commit()
    return {"success": True, "nickname": user.nickname}

@app.delete("/api/profile")
def delete_account(user: User = Depends(require_auth), db: Session = Depends(get_db)):
    db.query(SavedRecipe).filter_by(user_id=user.id).delete()
    db.delete(user)
    db.commit()
    return {"success": True}

# ── Saved Recipes ─────────────────────────────────────────────────────────────
class SaveReq(BaseModel):
    recipe_data: dict

class PatchReq(BaseModel):
    rating: Optional[int] = None
    memo:   Optional[str] = None

@app.post("/api/saved-recipes")
def save_recipe(req: SaveReq, user: User = Depends(require_auth), db: Session = Depends(get_db)):
    if db.query(SavedRecipe).filter_by(user_id=user.id).count() >= 100:
        raise HTTPException(400, "저장 레시피가 최대 100개를 초과했습니다.")
    row = SavedRecipe(id=str(uuid.uuid4()), user_id=user.id, recipe_data=json.dumps(req.recipe_data, ensure_ascii=False))
    db.add(row)
    db.commit()
    return {"success": True, "id": row.id}

@app.get("/api/saved-recipes")
def list_saved(user: User = Depends(require_auth), db: Session = Depends(get_db)):
    rows = db.query(SavedRecipe).filter_by(user_id=user.id).order_by(SavedRecipe.saved_at.desc()).all()
    return {
        "success": True,
        "recipes": [
            {"id": r.id, "recipe_data": json.loads(r.recipe_data),
             "rating": r.rating, "memo": r.memo,
             "saved_at": r.saved_at.isoformat() if r.saved_at else None}
            for r in rows
        ],
    }

@app.delete("/api/saved-recipes/{sid}")
def delete_saved(sid: str, user: User = Depends(require_auth), db: Session = Depends(get_db)):
    row = db.query(SavedRecipe).filter_by(id=sid, user_id=user.id).first()
    if not row:
        raise HTTPException(404, "레시피를 찾을 수 없습니다.")
    db.delete(row)
    db.commit()
    return {"success": True}

@app.patch("/api/saved-recipes/{sid}")
def patch_saved(sid: str, req: PatchReq, user: User = Depends(require_auth), db: Session = Depends(get_db)):
    row = db.query(SavedRecipe).filter_by(id=sid, user_id=user.id).first()
    if not row:
        raise HTTPException(404, "레시피를 찾을 수 없습니다.")
    if req.rating is not None:
        if not (1 <= req.rating <= 5):
            raise HTTPException(400, "별점은 1~5 사이여야 합니다.")
        row.rating = req.rating
    if req.memo is not None:
        if len(req.memo) > 500:
            raise HTTPException(400, "메모는 500자 이내여야 합니다.")
        row.memo = req.memo
    db.commit()
    return {"success": True}

# ── AI: 이미지 인식 ───────────────────────────────────────────────────────────
@app.post("/api/recognize")
def recognize(image: UploadFile = File(...)):
    if image.content_type not in ALLOWED_MIME:
        raise HTTPException(400, "JPEG, PNG, WEBP 파일만 지원합니다.")
    contents = image.file.read()
    if len(contents) > MAX_FILE:
        raise HTTPException(400, "파일 크기가 10MB를 초과합니다.")
    b64 = base64.b64encode(contents).decode()
    payload = {
        "model": VISION_MODEL,
        "messages": [{"role": "user", "content": [
            {"type": "image_url", "image_url": {"url": f"data:{image.content_type};base64,{b64}"}},
            {"type": "text", "text": RECOGNIZE_PROMPT},
        ]}],
    }
    raw = _call_or(payload, retries=3, wait=10)
    return {"success": True, "ingredients": _parse_list(raw), "raw_response": raw}

# ── AI: 레시피 생성 ───────────────────────────────────────────────────────────
class Filters(BaseModel):
    cooking_time: int = 30
    difficulty:   str = "보통"
    servings:     int = 2

class RecipeReq(BaseModel):
    ingredients: list[str]
    filters:     Filters = Filters()

@app.post("/api/recipe")
def recipe_gen(req: RecipeReq, authorization: str = Header(None), db: Session = Depends(get_db)):
    if not req.ingredients:
        raise HTTPException(400, "재료 목록이 비어 있습니다.")

    constraints = ""
    if authorization and authorization.startswith("Bearer "):
        try:
            uid  = read_token(authorization.split(" ", 1)[1])
            user = db.query(User).filter_by(id=uid).first()
            if user:
                al  = json.loads(user.allergies or "[]")
                dis = json.loads(user.disliked_ingredients or "[]")
                pre = json.loads(user.preferred_cuisine or "[]")
                if al:  constraints += f"\nIMPORTANT - Absolutely exclude these allergy ingredients: {', '.join(al)}"
                if dis: constraints += f"\nAvoid if possible: {', '.join(dis)}"
                if pre: constraints += f"\nPreferred cuisine: {', '.join(pre)}"
        except Exception:
            pass

    prompt = RECIPE_TMPL.format(
        ingredients=", ".join(req.ingredients),
        time=req.filters.cooking_time,
        difficulty=req.filters.difficulty,
        servings=req.filters.servings,
        constraints=constraints,
    )
    raw = _call_text(prompt)
    return {"success": True, "recipes": _parse_recipes(raw, req.ingredients)}

# ── 공통 유틸 ─────────────────────────────────────────────────────────────────
def _call_or(payload: dict, retries: int, wait: int) -> str:
    """단일 모델로 retry. 429면 retries 횟수만큼 재시도."""
    hdrs = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
    for i in range(retries):
        if i: time.sleep(wait * i)
        try:
            r = requests.post(OR_URL, headers=hdrs, json=payload, timeout=60)
        except requests.RequestException as e:
            raise HTTPException(502, f"API 연결 오류: {e}")
        if r.status_code == 200:
            return r.json()["choices"][0]["message"]["content"]
        if r.status_code == 429:
            continue
        try:
            err = r.json().get("error", {}).get("message", "알 수 없는 오류")
        except Exception:
            err = r.text[:200]
        raise HTTPException(502, f"AI 오류: {err}")
    raise HTTPException(429, "rate_limit")


def _call_text(prompt: str, temperature: float = 0.7) -> str:
    """TEXT_MODELS 우선순위 순서로 시도. 모두 429면 503 반환."""
    hdrs = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
    for model in TEXT_MODELS:
        payload = {"model": model, "messages": [{"role": "user", "content": prompt}], "temperature": temperature}
        for attempt in range(2):
            if attempt: time.sleep(10)
            try:
                r = requests.post(OR_URL, headers=hdrs, json=payload, timeout=60)
            except requests.RequestException as e:
                raise HTTPException(502, f"API 연결 오류: {e}")
            if r.status_code == 200:
                return r.json()["choices"][0]["message"]["content"]
            if r.status_code == 429:
                continue
            try:
                err = r.json().get("error", {}).get("message", "알 수 없는 오류")
            except Exception:
                err = r.text[:200]
            raise HTTPException(502, f"AI 오류: {err}")
    raise HTTPException(503, "현재 모든 AI 모델이 혼잡합니다. 잠시 후 다시 시도해주세요.")

def _parse_list(raw: str) -> list[str]:
    m = re.search(r"\[.*?\]", raw, re.DOTALL)
    if m:
        try:
            r = json.loads(m.group())
            if isinstance(r, list):
                return [str(i).strip() for i in r if i]
        except json.JSONDecodeError:
            pass
    return [i.strip().strip('"\'') for i in re.split(r"[\n,]+", raw.strip('[]"\'')) if i.strip()]

def _parse_recipes(raw: str, available: list[str]) -> list[dict]:
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()
    m = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if m:
        try:
            data    = json.loads(m.group())
            recipes = data.get("recipes", [])
            avail   = set(available)
            for r in recipes:
                r["id"] = str(uuid.uuid4())
                for ing in r.get("ingredients", []):
                    ing["available"] = ing.get("name", "") in avail
            return recipes[:3]
        except json.JSONDecodeError:
            pass
    return []

# ── 페이지 라우트 ─────────────────────────────────────────────────────────────
@app.get("/recipe")
def page_recipe():    return FileResponse(Path(__file__).parent / "static" / "recipe.html")

@app.get("/myrecipes")
def page_myrecipes(): return FileResponse(Path(__file__).parent / "static" / "myrecipes.html")

@app.get("/profile")
def page_profile():   return FileResponse(Path(__file__).parent / "static" / "profile.html")

app.mount("/", StaticFiles(directory=Path(__file__).parent / "static", html=True), name="static")
