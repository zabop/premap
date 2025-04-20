from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request, Query
from fastapi.responses import JSONResponse

from pydantic import BaseModel
import xml.etree.ElementTree as ET

from requests_oauthlib import OAuth2Session

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

import os

from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

origins = ["https://zabop.github.io", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


uri = os.getenv("MONGODB_URI")
client = MongoClient(uri, server_api=ServerApi("1"))

db = client["power"]
collection = db["candidates"]


def auth(auth_header):

    token = {
        "access_token": auth_header.replace("Bearer ", ""),
        "token_type": "Bearer",
        "scope": ["read_prefs"],
    }
    resp = OAuth2Session(token=token).get(
        "https://api.openstreetmap.org/api/0.6/user/details"
    )
    user = ET.fromstring(resp.content).find("user").attrib["display_name"]

    return user


def prepare_URL_resp():
    return collection.find_one({"reviews": {}})["URL"]


@app.get("/get")
async def get(request: Request):
    return JSONResponse({"URL": prepare_URL_resp()})
