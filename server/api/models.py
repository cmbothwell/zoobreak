import datetime
from enum import Enum

from django.db import models
from django.utils import timezone

from .types import EventType
from .validators import validate_address, validate_discord, validate_twitter


class EventLog(models.Model):
    event_types = set((item.value, item.value) for item in EventType)

    def __str__(self):
        return f"{self.type} - {self.transaction_hash}"

    transaction_hash = models.CharField(max_length=256, null=False, blank=False)
    type = models.CharField(max_length=256, null=False, blank=False, choices=event_types)


class Wallet(models.Model):
    def __str__(self):
        return self.address

    @classmethod
    def rank_by_join_date(cls):
        rank = 1
        wallet_set = cls.objects.all().order_by('join_date')

        for wallet in wallet_set:
            wallet.rank = rank
            wallet.save()
            rank += 1

    address = models.CharField(max_length=42, null=False, blank=False, unique=True, validators=[validate_address])
    email = models.EmailField(max_length=256, null=False, blank=False, unique=True)
    discord = models.CharField(max_length=256, null=False, blank=False, unique=True, validators=[validate_discord])
    twitter = models.CharField(max_length=256, null=False, blank=False, unique=True, validators=[validate_twitter])
    join_date = models.DateField(null=False, default=timezone.now)
    points = models.IntegerField(null=False, blank=False, default=0)
    love = models.IntegerField(null=False, blank=False, default=0)
    # Assigned dynamically - nullability facilitates ease
    rank = models.IntegerField(null=True, blank=True, unique=True)

    def repair_love(self):
        """Hopefully won't need to be called"""
        expected = 0

        for og in self.og_set.all():
            expected += og.love

        if self.love != expected:
            self.love = expected
            self.save()

    def get_status(self):
        status = {
            "address": self.address,
            "email": self.email,
            "discord": self.discord,
            "twitter": self.twitter,
            "join_date": self.join_date,
            "points": self.points,
        }

        return status

    def get_tokens(self):
        tokens = []
        for token in self.og_set.all():
            tokens.append(token.get_status())

        return tokens


class OG(models.Model):
    # hours that each feeding lasts
    HOURS_FED = 10
    # hours that OG is hungry before it starts starving
    HOURS_HUNGRY = 4
    # hours that OG starves until it dies
    HOURS_STARVING = 8
    # hours until your OG starts starving after birth
    HOURS_FED_AFTER_BIRTH = HOURS_HUNGRY + HOURS_STARVING

    # good night's sleep
    HOURS_SLEEP = 8
    # hours rested after sleep
    HOURS_RESTED = 14
    # hours tired
    HOURS_TIRED = 2
    # hours max deprived until death
    HOURS_SLEEP_DEPRIVED = 12
    # hours until OG starts being sleep-deprived
    HOURS_RESTED_AFTER_BIRTH = HOURS_RESTED + HOURS_TIRED + HOURS_SLEEP_DEPRIVED

    '''
    ---------- | -----------| ------------- || R.I.P
        FED        HUNGRY       STARVING       DEAD

    ---------- | -----------| ------------- || R.I.P
      RESTED       TIRED        DEPRIVED       DEAD
    '''

    # Love points feeding
    LOVE_FEED_WHEN_HUNGRY = 1
    LOVE_FEED_WHEN_STARVING = -1
    LOVE_OVERFEEDING = -2

    # Love points sleeping
    LOVE_SLEEP_WHEN_RESTED = 0
    LOVE_SLEEP_WHEN_TIRED = 4
    LOVE_SLEEP_WHEN_DEPRIVED = -6

    class HungerStatus(Enum):
        DEAD = "DEAD"
        STARVING = "STARVING"
        HUNGRY = "HUNGRY"
        FED = "FED"

    class SleepStatus(Enum):
        DEAD = "DEAD"
        SLEEP_DEPRIVED = "SLEEP_DEPRIVED"
        TIRED = "TIRED"
        RESTED = "RESTED"

    @staticmethod
    def birth_fed_until():
        now = timezone.now()
        return now + datetime.timedelta(hours=OG.HOURS_FED_AFTER_BIRTH)

    @staticmethod
    def birth_rested_until():
        now = timezone.now()
        return now + datetime.timedelta(hours=OG.HOURS_RESTED_AFTER_BIRTH)

    def __str__(self):
        return f"Token #{self.token_id}" if not self.name else f"{self.name} ({self.token_id})"

    # wallet shouldn't be null in practice, but this eases development
    token_id = models.IntegerField(null=False, blank=False, unique=True)
    wallet = models.ForeignKey('api.Wallet', null=True, blank=True, on_delete=models.PROTECT)
    name = models.CharField(max_length=256, null=False, blank=False)  # Null is empty string
    birthday = models.DateField(null=False, default=timezone.now)
    fed_until = models.DateTimeField(null=False, default=birth_fed_until.__func__)
    rested_until = models.DateTimeField(null=False, default=birth_rested_until.__func__)
    sleeping_until = models.DateTimeField(null=False, default=timezone.now)
    love = models.IntegerField(null=False, default=0)
    purged = models.BooleanField(default=False)

    @property
    def is_alive(self):
        if self.__hunger_state() != self.HungerStatus.DEAD and self.__sleep_state() != self.SleepStatus.DEAD:
            return True
        else:
            return False

    @property
    def is_sleeping(self):
        if not self.is_alive:
            return False

        return self.sleeping_until > timezone.now()

    def __refresh(self):
        self.save()

    def __purge(self):
        self.purged = True
        self.__refresh()

    def __revive(self):
        self.fed_until = self.birth_fed_until()
        self.rested_until = self.birth_rested_until()
        self.sleeping_until = timezone.now
        self.love = 0

        self.purged = False
        self.__refresh()

    def __hunger_state(self):
        food_delta = self.fed_until - timezone.now()

        if food_delta > datetime.timedelta(hours=(self.HOURS_HUNGRY + self.HOURS_STARVING)):
            return self.HungerStatus.FED

        elif food_delta > datetime.timedelta(hours=self.HOURS_STARVING):
            return self.HungerStatus.HUNGRY

        elif food_delta > datetime.timedelta(hours=0):
            return self.HungerStatus.STARVING

        else:
            return self.HungerStatus.DEAD

    def __feed_manual(self, hours):
        self.fed_until += datetime.timedelta(hours=hours)

    def __sleep_state(self):
        sleep_delta = self.rested_until - timezone.now()

        if sleep_delta > datetime.timedelta(hours=(self.HOURS_TIRED + self.HOURS_SLEEP_DEPRIVED)):
            return self.SleepStatus.RESTED

        elif sleep_delta > datetime.timedelta(hours=self.HOURS_SLEEP_DEPRIVED):
            return self.SleepStatus.TIRED

        elif sleep_delta > datetime.timedelta(hours=0):
            return self.SleepStatus.SLEEP_DEPRIVED

        else:
            return self.SleepStatus.DEAD

    def __modify_love(self, amount):
        """All modifications to love should go through this private method"""
        if self.wallet is not None:
            self.wallet.love += amount
            self.wallet.save()

        self.love += amount
        self.save()

    # Debugging function
    def _reset(self, **kwargs):
        self.fed_until = kwargs.get('fed_until', OG.birth_fed_until())
        self.rested_until = kwargs.get('rested_until', OG.birth_rested_until())
        self.sleeping_until = kwargs.get('sleeping_until', timezone.now())
        self.love = kwargs.get('love', 0)
        self.__refresh()

    def get_status(self, message=""):
        self.__refresh()

        status = {
            "token_id": self.token_id,
            "name": self.name if self.name != "" else "Token #" + str(self.token_id),
            "is_alive": self.is_alive,
            "hunger": self.__hunger_state().value,
            "fed_until": self.fed_until,
            "sleep": self.__sleep_state().value,
            "rested_until": self.rested_until,
            "is_sleeping": self.is_sleeping,
            "sleeping_until": self.sleeping_until,
            "love": self.love,
            "message": message,
        }

        return status

    def feed(self):
        if self.is_sleeping:
            return self.get_status(message="You can't feed me when I am asleep!")

        hunger_state = self.__hunger_state()
        shift_fed_until = self.HOURS_FED + self.HOURS_HUNGRY + self.HOURS_STARVING

        if hunger_state == self.HungerStatus.FED:
            self.fed_until = timezone.now() + datetime.timedelta(hours=shift_fed_until)

            self.__modify_love(self.LOVE_OVERFEEDING)
            message = f'I wasn\'t hungry! Now you overfed me, my love is now down {self.LOVE_OVERFEEDING} to {self.love}'

        elif hunger_state == self.HungerStatus.HUNGRY:
            self.fed_until = timezone.now() + datetime.timedelta(hours=shift_fed_until)

            self.__modify_love(self.LOVE_FEED_WHEN_HUNGRY)
            message = f'Yummy! My love rating increased to: {self.love}'

        elif hunger_state == self.HungerStatus.STARVING:
            self.fed_until = timezone.now() + datetime.timedelta(hours=shift_fed_until)

            self.__modify_love(self.LOVE_FEED_WHEN_STARVING)
            message = f'I nearly died! My love rating decreased to: {self.love}'

        else:
            message = "I'm dead, you are late!"

        self.__refresh()
        return self.get_status(message=message)

    def sleep(self):
        if self.is_sleeping:
            return self.get_status(message="I am already asleep!")

        now = timezone.now()
        sleep_state = self.__sleep_state()

        sleep_delta = self.rested_until - now
        extend_rested_until = self.HOURS_SLEEP + self.HOURS_RESTED + self.HOURS_TIRED + self.HOURS_SLEEP_DEPRIVED

        if sleep_state == self.SleepStatus.RESTED:
            self.rested_until = now + datetime.timedelta(hours=extend_rested_until)
            self.sleeping_until = now + datetime.timedelta(hours=self.HOURS_SLEEP)

            self.__modify_love(self.LOVE_SLEEP_WHEN_RESTED)
            message = "I'm not tired but I'll go to sleep"

        elif sleep_state == self.SleepStatus.TIRED:
            rest_tired_time = sleep_delta - datetime.timedelta(hours=self.HOURS_SLEEP_DEPRIVED)
            self.rested_until = now + rest_tired_time + datetime.timedelta(hours=extend_rested_until)
            self.sleeping_until = now + datetime.timedelta(hours=rest_tired_time + self.HOURS_SLEEP)

            self.__modify_love(self.LOVE_SLEEP_WHEN_TIRED)
            message = f'Ahhhh good night! My love rating increased to: {self.love}'

        elif sleep_state == self.SleepStatus.SLEEP_DEPRIVED:
            self.rested_until = now + datetime.timedelta(hours=extend_rested_until)
            self.sleeping_until = now + datetime.timedelta(hours=self.HOURS_SLEEP)

            self.__modify_love(self.LOVE_SLEEP_WHEN_DEPRIVED)
            message = f'I nearly died! My love rating decreased to: {self.love}'

        else:
            message = "I'm dead, you are late!"

        self.__refresh()
        return self.get_status(message=message)
