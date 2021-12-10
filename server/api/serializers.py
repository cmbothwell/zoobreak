import re

from django.conf import settings
from django.contrib.auth.models import User, Group
from rest_framework import serializers

from web3 import Web3

from .chain import validate_wallet_registration, validate_wallet_simple, validate_action, validate_mint_request
from .types import ActionType


class SimpleWalletSerializer(serializers.Serializer):
    address = serializers.CharField(max_length=42)
    signature = serializers.CharField(max_length=256)

    def validate_address(self, value):
        if not Web3.isChecksumAddress(value):
            raise serializers.ValidationError(f"Invalid Address: {value}")
        return value

    def validate(self, data):
        validate_wallet_simple(data['address'], data['signature'])
        return data


class WalletSerializer(serializers.Serializer):
    address = serializers.CharField(max_length=42)
    email = serializers.EmailField(max_length=256)
    discord = serializers.CharField(max_length=256)
    twitter = serializers.CharField(max_length=256)
    points = serializers.IntegerField(read_only=True)
    rank = serializers.IntegerField(read_only=True)

    # These match the model level validators exactly - unfortunately we reproduce them here
    # as calling them via the ModelSerializer introspection was causing problems
    def validate_address(self, value):
        if not Web3.isChecksumAddress(value):
            raise serializers.ValidationError(f"Invalid Address: {value}")
        return value

    def validate_discord(self, value):
        regex = re.compile('^.{3,32}#[0-9]{4}$', re.I)
        match = regex.match(value)

        if not bool(match):
            raise serializers.ValidationError(f"Invalid Discord Username: {value}")
        return value

    def validate_twitter(self, value):
        regex = re.compile('^@[a-zA-Z0-9_]{1,15}$')
        match = regex.match(value)

        if not bool(match):
            raise serializers.ValidationError(f"Invalid Twitter Username: {value}")
        return value


class WalletRegistrationSerializer(serializers.Serializer):
    wallet = WalletSerializer()
    signature = serializers.CharField(max_length=256)

    def validate(self, data):
        validate_wallet_registration(data['wallet'], data['signature'])
        return data


class ActionSerializer(serializers.Serializer):
    id = serializers.IntegerField(min_value=1)
    type = serializers.CharField()

    def validate_type(self, value):
        action_types = set(item.value for item in ActionType)
        if value not in action_types:
            raise serializers.ValidationError(f"Invalid Action: {value}")
        return value


class ValidatedActionSerializer(serializers.Serializer):
    action = ActionSerializer()
    signature = serializers.CharField(max_length=256)

    def validate(self, data):
        validate_action(data['action'], data['signature'])
        return data


class MintRequestSerializer(serializers.Serializer):
    address = serializers.CharField(max_length=42)
    quantity = serializers.IntegerField(min_value=1, max_value=settings.MAX_ZOO_PER_MINT)

    def validate_address(self, value):
        if not Web3.isChecksumAddress(value):
            raise serializers.ValidationError(f"Invalid Address: {value}")
        return value


class ValidatedMintRequestSerializer(serializers.Serializer):
    mint_request = MintRequestSerializer()
    signature = serializers.CharField(max_length=256)

    def validate(self, data):
        validate_mint_request(data['mint_request'], data['signature'])
        return data


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ['url', 'username', 'email', 'groups']


class GroupSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Group
        fields = ['url', 'name']