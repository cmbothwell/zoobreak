import json

from django.conf import settings
from django.utils.crypto import get_random_string

from eth_abi import encode_abi
from eth_account.messages import encode_defunct
from rest_framework.exceptions import ParseError
from web3 import Web3

from api.errors import BadSignature, FaultyRegistration, TokenNotOwned, TokenNotFound, FaultyMintRequest

w3 = Web3(Web3.HTTPProvider(settings.RPC_PROVIDER))


def get_chain_contract():
    return w3.eth.contract(address=settings.ZOO_CONTRACT_ADDRESS, abi=settings.ZOO_ABI)


zoo = get_chain_contract()


def get_token_uri(token_id):
    return zoo.functions.tokenURI(token_id).call()


def prep_solidity_bytes(types, args):
    """Prepares abi encoded types and args for solidity style encoding
       Pass to Web3.solidityKeccak via (['bytes'], [prepped_bytes])"""
    hex_str = encode_abi(types, args).hex()
    msg = encode_defunct(hexstr=hex_str)

    prepped_bytes = b'\x19' + msg.version + msg.header + msg.body

    return prepped_bytes


def prep_signable_message(types, args):
    """Gives signable message type which is passed to w3.eth.account.sign_message w. private key
       message hash is the same as Web3.solidityKeccak called via prepped_bytes in above function"""
    hex_str = encode_abi(types, args).hex()
    msg = encode_defunct(hexstr=hex_str)
    return msg


def validate_wallet_simple(address, signature):
    """Validate wallet value by signing its own address"""
    address_message = encode_defunct(text=address)

    try:
        sender_address = w3.eth.account.recover_message(address_message, signature=signature)
    except Exception:
        raise BadSignature

    address = address

    if address != sender_address:
        raise BadSignature

    return


def validate_wallet_registration(registration_request, signature):
    """Validate wallet value by signing its own registration value"""
    address = registration_request.get("address")

    registration_json = json.dumps(registration_request, separators=(',', ':'))
    registration_message = encode_defunct(text=registration_json)

    try:
        sender_address = w3.eth.account.recover_message(registration_message, signature=signature)
    except Exception:
        raise BadSignature

    if address != sender_address:
        raise FaultyRegistration

    return


def validate_action(action, signature):
    token_id = action.get('id')

    action_json = json.dumps(action, separators=(',', ':'))
    action_message = encode_defunct(text=action_json)

    try:
        sender_address = w3.eth.account.recover_message(action_message, signature=signature)
    except Exception:
        raise BadSignature

    try:
        owner_address = zoo.functions.ownerOf(token_id).call()
    except ValueError:
        raise TokenNotFound

    if sender_address != owner_address:
        raise TokenNotOwned

    return


def validate_mint_request(mint_request, signature):
    address = mint_request.get("address")

    mint_request_json = json.dumps(mint_request, separators=(',', ':'))
    mint_request_message = encode_defunct(text=mint_request_json)

    try:
        sender_address = w3.eth.account.recover_message(mint_request_message, signature=signature)
    except Exception:
        raise BadSignature

    if address != sender_address:
        raise FaultyMintRequest

    return


def sign_mint_request(address, quantity):
    nonce = get_random_string(length=settings.RANDOM_NONCE_LENGTH)

    types = ['address', 'uint256', 'string']
    args = [address, quantity, nonce]

    signable_message = prep_signable_message(types, args)
    signed_message = w3.eth.account.sign_message(signable_message, private_key=settings.PRIVATE_KEY)

    hash = signed_message.messageHash
    signature = signed_message.signature

    return {
        'address': address,
        'quantity': quantity,
        'nonce': nonce,
        'hash': hash.hex(),
        'signature': signature.hex()
    }


def sign_love_withdrawal_request(address, amount):
    nonce = get_random_string(length=settings.RANDOM_NONCE_LENGTH)

    types = ['address', 'uint256', 'string']
    args = [address, amount, nonce]

    signable_message = prep_signable_message(types, args)
    signed_message = w3.eth.account.sign_message(signable_message, private_key=settings.PRIVATE_KEY)

    hash = signed_message.messageHash
    signature = signed_message.signature

    return {
        'address': address,
        'amount': amount,
        'nonce': nonce,
        'hash': hash.hex(),
        'signature': signature.hex()
    }
