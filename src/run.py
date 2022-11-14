import requests


def pause(room):
    url = "http://localhost:5005/"
    url += room
    url += "/pause/"
    eq = requests.get(url)
    print(url)


def play(room):
    url = "http://localhost:5005/"
    url += room
    url += "/play/"
    eq = requests.get(url)
    print(url)


def setVolume(room, level):
    url = "http://localhost:5005/"
    url += room
    url += "/volume/"
    url += level
    eq = requests.get(url)
    print(url)


pause("bedroom")
play("bedroom")
# setVolume("bedroom", "49")
