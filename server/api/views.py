from django.contrib.auth.models import User, Group

from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework import permissions
from rest_framework.parsers import JSONParser
from rest_framework.response import Response

from . import service
from .serializers import UserSerializer, GroupSerializer, WalletRegistrationSerializer, SimpleWalletSerializer, \
    ValidatedActionSerializer, ValidatedMintRequestSerializer
from .service import send_action, register_wallet, verify_and_sign_mint_request


@api_view(['GET'])
def get_metadata(request, token_id):
    image_id = token_id % 100
    return Response(f"https://randomfox.ca/images/{image_id}.jpg")


# Create your views here.
@api_view(['GET'])
def ping(request):
    """
    A basic test endpoint to make sure we're up and running
    """
    return Response("Successfully Got Some Data")


@api_view(['POST'])
def get_wallet(request):
    """
    POST: Get wallet info
    """
    data = JSONParser().parse(request)
    wallet = SimpleWalletSerializer(data=data)

    if wallet.is_valid(raise_exception=True):
        wallet = service.get_wallet(address=wallet.validated_data['address'])
        return Response(wallet.get_status())


@api_view(['POST'])
def get_tokens(request):
    """
    POST: Get owned tokens
    """
    data = JSONParser().parse(request)
    wallet = SimpleWalletSerializer(data=data)

    if wallet.is_valid(raise_exception=True):
        wallet = service.get_wallet(address=wallet.validated_data['address'])
        return Response(service.get_tokens(wallet.address))


@api_view(['POST'])
def register_wallet(request):
    """
    POST: Register user
    """
    data = JSONParser().parse(request)
    wallet = WalletRegistrationSerializer(data=data)

    if wallet.is_valid(raise_exception=True):
        wallet = service.register_wallet(**wallet.validated_data['wallet'])
        return Response(wallet.get_status())


@api_view(['POST'])
def update_wallet(request):
    """
    POST: Update wallet registration
    """
    data = JSONParser().parse(request)
    wallet = WalletRegistrationSerializer(data=data)

    if wallet.is_valid(raise_exception=True):
        wallet = register_wallet(update=True, **wallet.validated_data['wallet'])
        return Response(wallet.get_status())


@api_view(['POST'])
def mint_request(request):
    """
    POST: Retrieve mint parameters and send a signed message authorizing the mint
    """
    data = JSONParser().parse(request)
    validated_mint_request = ValidatedMintRequestSerializer(data=data)

    if validated_mint_request.is_valid(raise_exception=True):
        address = validated_mint_request.validated_data['mint_request']['address']
        quantity = validated_mint_request.validated_data['mint_request']['quantity']

        return Response(verify_and_sign_mint_request(address, quantity))


@api_view(['POST'])
def withdraw_love(request):
    """
    Retrieve parameters to withdraw love
    """
    data = JSONParser().parse(request)
    wallet = SimpleWalletSerializer(data=data)

    if wallet.is_valid(raise_exception=True):
        love_request = service.verify_and_withdraw_love(address=wallet.validated_data['address'])
        return Response(love_request)


@api_view(['POST'])
def action(request):
    """
    Interact with the giraffe via the specified action
    @param: action object - json with keys 'id' and 'action' (see action types)
    @param: signature - signature of signed string repr. of action object.
    Passed to decorator to validate action - address is recovered to verify ownership
    @returns: json indicating action outcome
    """
    data = JSONParser().parse(request)
    validated_action = ValidatedActionSerializer(data=data)

    if validated_action.is_valid(raise_exception=True):
        id = validated_action.validated_data['action']['id']
        type = validated_action.validated_data['action']['type']

        response = send_action(id, type)
        return Response(response)


class UserViewSet(viewsets.ModelViewSet):
    """
    View and edit users (only to test)
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


class GroupViewSet(viewsets.ModelViewSet):
    """
    View and edit groups (only to test)
    """
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]