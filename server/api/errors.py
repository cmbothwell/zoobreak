from rest_framework.exceptions import APIException


class BadSignature(APIException):
    status_code = 400
    default_detail = 'Signature provided was not valid.'
    default_code = 'bad_signature'


class FaultyRegistration(APIException):
    status_code = 403
    default_detail = 'Something is wrong with the signature you provided.'
    default_code = 'permission_denied'


class DuplicateRegistration(APIException):
    status_code = 400
    default_detail = 'You can only register your address once.'
    default_code = 'duplicate_registration'


class DuplicateRegistrationInfo(APIException):
    status_code = 400
    default_detail = 'Some details from your registration are already taken.'
    default_code = 'duplicate_registration_info'


class FaultyMintRequest(APIException):
    status_code = 403
    default_detail = 'Something is wrong with the signature you provided.'
    default_code = 'permission_denied'


class WalletNotFound(APIException):
    status_code = 404
    default_detail = 'This wallet does not exist.'
    default_code = 'not_found'


class TokenNotOwned(APIException):
    status_code = 403
    default_detail = 'You do not have permission to act on this token.'
    default_code = 'permission_denied'


class TokenNotFound(APIException):
    status_code = 404
    default_detail = 'This token does not exist.'
    default_code = 'not_found'


class CannotWithdrawNegativeLove(APIException):
    status_code = 400
    default_detail = 'You cannot withdraw negative love'
    default_code = 'no_negative_withdraw'
