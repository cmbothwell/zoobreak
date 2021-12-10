# Service layer between controller and models
from django.conf import settings
from rest_framework import serializers
from rest_framework.exceptions import ParseError

from django.db.utils import IntegrityError

from api.chain import sign_mint_request, sign_love_withdrawal_request, validate_wallet_simple, get_token_uri
from api.errors import DuplicateRegistration, WalletNotFound, DuplicateRegistrationInfo, CannotWithdrawNegativeLove, \
    TokenNotFound
from api.models import OG, Wallet
from api.types import ActionType


def send_action(id, type):
    og = OG.objects.get(id=id)

    if type == ActionType.STATUS.value:
        return og.get_status()
    elif type == ActionType.FEED.value:
        return og.feed()
    elif type == ActionType.SLEEP.value:
        return og.sleep()
    else:
        raise serializers.ValidationError('Invalid action')


def get_wallet(address):
    if not Wallet.objects.filter(address=address).exists():
        raise WalletNotFound

    return Wallet.objects.get(address=address)


def get_tokens(address):
    if not Wallet.objects.filter(address=address).exists():
        raise WalletNotFound

    wallet = Wallet.objects.get(address=address)
    tokens = wallet.get_tokens()

    if tokens is None:
        return {}

    for token in tokens:
        token['token_uri'] = get_token_uri(token['token_id'])

    return tokens


def register_wallet(update=False, **kwargs):
    if update:
        address = kwargs.get('address')
        email = kwargs.get('email')
        discord = kwargs.get('discord')
        twitter = kwargs.get('twitter')

        if not Wallet.objects.filter(address=address).exists():
            raise WalletNotFound

        wallet = Wallet.objects.get(address=address)
        wallet.email = email
        wallet.discord = discord
        wallet.twitter = twitter

        try:
            wallet.save()
            return wallet
        except IntegrityError:
            raise DuplicateRegistrationInfo
    else:
        try:
            return Wallet.objects.create(**kwargs)
        except IntegrityError:
            raise DuplicateRegistration


def verify_and_sign_mint_request(address, quantity):
    if settings.ALLOW_MINT_REGISTERED_WALLETS_ONLY:
        if not Wallet.objects.filter(address=address).exists():
            raise WalletNotFound

    return sign_mint_request(address, quantity)


def verify_and_withdraw_love(address):
    if not Wallet.objects.filter(address=address).exists():
        raise WalletNotFound

    wallet = Wallet.objects.get(address=address)
    love = wallet.love

    if not love > 0:
        raise CannotWithdrawNegativeLove

    signed_love_withdrawal_request = sign_love_withdrawal_request(wallet.address, love)

    wallet.love = 0
    wallet.save()

    return signed_love_withdrawal_request


# *********************************** #
#            MANAGEMENT               #
# *********************************** #


def create_og(token_id, wallet):
    return OG.objects.create(token_id=token_id, wallet=wallet)


def update_og_owner(token_id, wallet):
    og = OG.objects.get(token_id=token_id)
    og.wallet = wallet

    og.save()
    return og


def name_og(token_id, name):
    if not OG.objects.filter(token_id=token_id):
        raise TokenNotFound

    og = OG.objects.get(token_id=token_id)
    og.name = name
    og.save()

    return og


def purge_ogs():
    og_set = OG.objects.filter(purged=False)

    for og in og_set:
        if not og.is_alive:
            og.__purge()
