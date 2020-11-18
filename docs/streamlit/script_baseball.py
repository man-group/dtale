import json
import pandas as pd
import requests
import streamlit as st
import urllib
import uuid

from bs4 import BeautifulSoup
from logging import getLogger

from dtale.app import get_instance
from dtale.global_state import cleanup
from dtale.views import startup

logger = getLogger(__name__)

CSS = """
<style>
    iframe.grid {
      width: 100%;
      height: 700px;
      border: none;
    }
    iframe.chart {
      height: 900px;
      width: 100%;
      border: none;
    }
    .reportview-container .main .block-container {
      max-width: inherit;
      padding: 1rem 1.5rem 1rem 1.5rem;
    }
</style> 
"""


def load_content(url):
    resp = None
    tries = 0
    while resp is None and tries < 5:
        try:
            resp = requests.get(url)
        except:
            tries = tries + 1
            logger.debug("failed to load %s, retry %d", url, tries)
    content = resp.text
    return BeautifulSoup(content, features="lxml")


BASEBALL_REF_HOST = "https://www.baseball-reference.com"


def build_baseball_ref_endpoint(route):
    return "{}{}".format(BASEBALL_REF_HOST, route)


class PlayerPageRedirectException(Exception):
    """Container for when a player search jumps directly to a player page."""

    def __init__(self, player_page_content):
        self.player_page_content = player_page_content


def load_player_suggestions(input):
    if not input:
        return []
    search_url = build_baseball_ref_endpoint(
        "/search/search.fcgi?{}".format(urllib.parse.urlencode(dict(search=input)))
    )
    content = load_content(search_url)
    if content.find(id="div_batting_standard") is not None:
        # if the search matches a player directly in baseball-reference it will redirect directly to the data page
        raise PlayerPageRedirectException(content)
    mlb_players = content.find(id="players")
    players_found = mlb_players.find_all("div", class_="search-item")
    parsed_players = []
    for player in players_found:
        link = player.find("div", class_="search-item-name").find("a")
        name, years = link.text.split("\n")
        parsed_players.append(
            dict(href=link.attrs["href"], name=name.strip(), years=years.strip())
        )
    if len(players_found) == 1:
        # if we only have one player to select to jump directly to data loading
        player_stats_url = build_baseball_ref_endpoint(parsed_players[0]["href"])
        raise PlayerPageRedirectException(load_content(player_stats_url))
    return parsed_players


def parse_player_df(content):
    name = content.select("h1[itemprop=name]")[0].text.strip()
    standard_batting = content.find(id="div_batting_standard")
    standard_batting_tbl = standard_batting.find("table")

    standard_batting_data = []
    headers = [
        ele.text.strip() for ele in standard_batting_tbl.find("thead").find_all("th")
    ]
    rows = standard_batting_tbl.find("tbody").find_all("tr", class_="full")
    for row in rows:
        cols = row.find_all("th") + row.find_all("td")
        cols = [ele.text.strip() for ele in cols]
        standard_batting_data.append(cols)
    df = pd.DataFrame(standard_batting_data, columns=headers)
    df.loc[:, "name"] = name
    str_cols = ["name", "Tm", "Lg", "Pos", "Awards"]
    float_cols = ["BA", "OBP", "SLG", "OPS"]
    int_cols = [c for c in df.columns if c not in str_cols + float_cols]
    df = df.astype({col: "int" for col in int_cols})
    df = df.astype({col: "float" for col in float_cols})
    df.loc[:, "Season"] = df.index + 1
    return df[["name", "Season"] + headers]


def load_player_df(href):
    player_stats_url = build_baseball_ref_endpoint(href)
    content = load_content(player_stats_url)
    return parse_player_df(content)


def update_dtale_data(player_data):
    curr_data = get_instance("1")
    if curr_data is not None:
        # append data to pre-existing data in D-Tale
        curr_data = curr_data.data
        curr_data = curr_data[~(curr_data["name"] == player_data["name"].values[0])]
        player_data = pd.concat([curr_data, player_data], ignore_index=True)
        cleanup("1")
    # load data to D-Tale
    startup(data_id="1", data=player_data)


def build_chart_url(names):
    params = {
        "chart_type": "line",
        "x": "Season",
        "y": json.dumps(["HR"]),
        "group": json.dumps(["name"]),
        "group_val": json.dumps([{"name": name} for name in names]),
    }
    return "/dtale/charts/1?{}".format(urllib.parse.urlencode(params))


def load_iframes():
    instance = get_instance("1")

    if instance is not None:
        names = instance.data["name"].unique()
        chart_url = build_chart_url(names)
        name_str = ", ".join(names)

        # use uuid so that way streamlit reloads iframes
        grid = (
            '<h3 style="padding-top: 10px">Data For: {}</h3>'
            '<iframe class="grid" src="/dtale/main/1?_id={}"/>'
        ).format(name_str, uuid.uuid4().hex)
        charts = '<iframe class="chart" src="{}&_id={}" />'.format(chart_url, uuid.uuid4().hex)
        return grid, charts
    return "", ""


st.title("Baseball App - Streamlit w/ D-Tale")
grid, charts = load_iframes()
player_suggestions = None
player = st.text_input("Player")
if player:
    try:
        player_suggestions = load_player_suggestions(player)
    except PlayerPageRedirectException as ex:
        player_data = parse_player_df(ex.player_page_content)
        update_dtale_data(player_data)
        grid, charts = load_iframes()

if player_suggestions:
    button_cols = st.beta_columns(len(player_suggestions))
    for player, col in zip(player_suggestions, button_cols):
        player_button = col.button(f'{player["name"]} ({player["years"]} years)')
        if player_button:
            player_data = load_player_df(player["href"])
            update_dtale_data(player_data)
            grid, charts = load_iframes()

html = f"""
{CSS}
{grid}
"""
st.markdown(html, unsafe_allow_html=True)
st.markdown(charts, unsafe_allow_html=True)
