from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request, Query
from fastapi.responses import JSONResponse, Response

from pydantic import BaseModel
import xml.etree.ElementTree as ET

from requests_oauthlib import OAuth2Session

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

import shapely.ops
import pyproj

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


class PostBody(BaseModel):
    URL: str
    sidelength_in_pixels: int
    x: int
    y: int


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
    selected = collection.find_one({"reviews": {}})
    return {"URL": selected["URL"], "helperUrl": selected["helperUrl"]}


maxc = 20037508.342789244
sidelength = lambda z: 2 * maxc / (2**z)


def get_SW_tile_corner(z, x, y):
    x = -maxc + sidelength(z) * x
    y = maxc - 2 * maxc / (2**z) - sidelength(z) * y
    return x, y


def pixel_coords_to_epsg3857_coords(url, sidelength_in_pixels, x, y):

    tileid = "/".join(url.split("/")[-3:]).replace(".jpg", "").replace(".jpeg", "")
    tilez, tilex, tiley = [int(e) for e in tileid.split("/")]
    x_epsg3857, y_epsg3857 = get_SW_tile_corner(tilez, tilex, tiley)

    dx = x / sidelength_in_pixels * sidelength(tilez)
    dy = (sidelength_in_pixels - y) / sidelength_in_pixels * sidelength(tilez)

    x_epsg3857 += dx
    y_epsg3857 += dy

    return [x_epsg3857, y_epsg3857]


def pixel_coords_to_lat_lon(url, sidelength_in_pixels, x, y):

    x_epsg3857, y_epsg3857 = pixel_coords_to_epsg3857_coords(
        url, sidelength_in_pixels, x, y
    )

    transformer = pyproj.Transformer.from_crs(
        pyproj.crs.CRS("epsg:3857"), pyproj.crs.CRS("epsg:4326"), always_xy=True
    )

    [lon], [lat] = shapely.ops.transform(
        transformer.transform, shapely.geometry.Point(x_epsg3857, y_epsg3857)
    ).xy

    return [lat, lon]


@app.get("/get_results")
async def get_results(request: Request):

    res = {
        "reviewed": [
            {e["URL"]: e["reviews"]}
            for e in collection.find()
            if len(e["reviews"]) != 0
        ]
    } | {
        "not_reviewed": [
            {e["URL"]: e["reviews"]}
            for e in collection.find()
            if len(e["reviews"]) == 0
        ]
    }

    return JSONResponse(res)


@app.get("/get")
async def get(request: Request):
    return JSONResponse(prepare_URL_resp())


@app.post("/post")
async def post(request: Request, postBody: PostBody):

    user = auth(request.headers.get("Authorization"))

    if postBody.x != -99:
        [lat, lon] = pixel_coords_to_lat_lon(
            postBody.URL,
            postBody.sidelength_in_pixels,
            postBody.x,
            postBody.y,
        )

    else:
        lat, lon = -99, -99

    collection.update_one(
        {"URL": postBody.URL},
        {
            "$set": {
                "reviews": {
                    user: {
                        "pixelcoords": [postBody.x, postBody.y],
                        "latlon": [lat, lon],
                    }
                }
            }
        },
    )

    return Response(status_code=200)
