import asyncio
import time
from typing import Union

from fastapi import FastAPI, WebSocket
from pydantic import BaseModel
from openai import OpenAI
from datetime import datetime
from fastapi.responses import HTMLResponse
import json
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
with open("openai.key", "r") as f:
    key = f.read()


client = OpenAI(api_key=key)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.websocket("/get_question")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    data = await websocket.receive_text()
    text, base64 = json.loads(data)
    print(text)

    response = client.chat.completions.create(
        model="gpt-4-vision-preview",
        messages=[
            {"role": "system", "content": "You are a helpful tutor, however, you SHOULD NOT solve problems for studnets. Instead, your task is to give more questions/problems for students. Students will upload images of their outline/exam and you should give them more prctise problems. You SHOULD NOT give correct answer. If you got a question, your job is also not to explain the question but give a simlar one. If your output has equations, put them into dollar signs ($equ here$). Do not request the user to do calculation but just entering the equation with constants. "},
            {"role": "user", "content": [{"type": "text", "text": text}, {"type": "image_url", "image_url": {"url": base64 } },],},
        ],
        stream=True,
        max_tokens=3000
    )

    msg = ""
    for i in response:
        print(i.choices[0].delta.content, end="", flush=True)
        if i is None:
            continue 
        msg += f"{i.choices[0].delta.content}"
        await websocket.send_text(f"{i.choices[0].delta.content}")
        await asyncio.sleep(0.05)
    await websocket.close()

@app.websocket("/check_ans")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    data = await websocket.receive_text()
    question, ans, base64 = json.loads(data)
    print([
            {"role": "system", "content": "You are a helpful tutor, however, you SHOULD NOT solve problems for studnets. Instead, you shuold check if the answer is correct. You will get the original question, user's scratch paper, and user's response. Think about it and grade the user. You should explain the question, then solve it, then check if user got it correct. You should NOT do ANY of the calculation yourself. Instead, just give equations, and just check if user's expression is the same or equivalent. If user's answer is correct, add GREAT at the end, if partically correct, SAY GOOD, if wrong, say BAD! If your output has equations, put them into dollar signs ($equ here$)." 
            },
            {"role":"user","content":"Question: "+question},
            {"role": "user", "content": 
                ([{"type": "text", "text": "User said:"+ans}, {"type": "image_url", "image_url": {"url": base64 } }]) if base64!="" else ({"type": "text", "text": "User said:"+ans})
            ,},
        ])
    response = client.chat.completions.create(
        model="gpt-4-vision-preview",
        messages=[
            {"role": "system", "content": "You are a helpful tutor, however, you SHOULD NOT solve problems for studnets. Instead, you shuold check if the answer is correct. You will get the original question, user's scratch paper, and user's response. Think about it and grade the user. You should explain the question, then solve it, then check if user got it correct. You should NOT do ANY of the calculation yourself. Instead, just give equations, and just check if user's expression is the same or equivalent. If user's answer is correct, add GREAT at the end, if partically correct, SAY GOOD, if wrong, say BAD! If your output has equations, put them into dollar signs ($equ here$)." 
            },
            {"role":"user","content":"Question: "+question},
            {"role": "user", "content": 
                ([{"type": "text", "text": "User said:"+ans}, {"type": "image_url", "image_url": {"url": base64 } }]) if base64!="" else ans
            ,},
        ],
        stream=True,
        max_tokens=3000
    )
    msg = "### Solution \n"
    await websocket.send_text(msg)
    for i in response:
        print(i.choices[0].delta.content, end="", flush=True)
        if i is None:
            continue 
        msg += f"{i.choices[0].delta.content}"
        await websocket.send_text(f"{i.choices[0].delta.content}")
        await asyncio.sleep(0.05)
    await websocket.close()


