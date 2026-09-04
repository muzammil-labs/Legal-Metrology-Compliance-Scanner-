from fastapi import FastAPI
app = FastAPI()

@app.get("/api/hello")
@app.post("/api/hello")
def hello():
    return {"hello": "world"}
