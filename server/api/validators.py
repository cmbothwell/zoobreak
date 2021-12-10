import re

from django.core.exceptions import ValidationError

from web3 import Web3


def validate_address(value):
    if not Web3.isChecksumAddress(value):
        raise ValidationError(
            'Invalid Address: %(value)',
            code='invalid_address',
            params={'value': value},
        )


def validate_discord(value):
    regex = re.compile('^.{3,32}#[0-9]{4}$', re.I)
    match = regex.match(value)

    if not bool(match):
        raise ValidationError(
            'Invalid Discord Username: %(value)',
            code='invalid_discord',
            params={'value': value},
        )


def validate_twitter(value):
    regex = re.compile('^@[a-zA-Z0-9_]{1,15}$')
    match = regex.match(value)

    if not bool(match):
        raise ValidationError(
            'Invalid Twitter Username: %(value)',
            code='invalid_twitter',
            params={'value': value},
        )