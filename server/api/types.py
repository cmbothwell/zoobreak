from enum import Enum


class ActionType(Enum):
    STATUS = "STATUS"
    FEED = "FEED"
    SLEEP = "SLEEP"


class EventType(Enum):
    TRANSFER = 'Transfer'
    NAME_CHANGE = 'NameChange'

