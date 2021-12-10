from celery import shared_task

from api.chain import get_chain_contract
from .models import Wallet, OG, EventLog
from .service import create_og, update_og_owner, name_og
from .types import EventType

zoo = get_chain_contract()

filters = {
    EventType.TRANSFER.value: zoo.events.Transfer.createFilter(fromBlock=0),
    EventType.NAME_CHANGE.value: zoo.events.NameChange.createFilter(fromBlock=0), # TODO Change from block in PROD
}


@shared_task
def watch_events(event_name):
    event_filter = filters.get(event_name, None)

    if event_filter:
        for event in event_filter.get_new_entries():
            handle_event(event, event_name)
    return


def handle_event(event, event_name):
    args = event['args']
    transaction_hash = event['transactionHash'].hex()

    if EventLog.objects.filter(transaction_hash=transaction_hash, type=event_name).exists():
        return

    if event_name == EventType.TRANSFER.value:
        to_address = args.get('to')
        token_id = args.get('tokenId')

        wallet = Wallet.objects.get(address=to_address) if Wallet.objects.filter(address=to_address).exists() else None
        og = OG.objects.get(token_id=token_id) if OG.objects.filter(token_id=token_id).exists() else None

        if not og:
            create_og(token_id, wallet)
        else:
            if wallet:
                update_og_owner(token_id, wallet)

    if event_name == EventType.NAME_CHANGE.value:
        token_id = args.get('tokenId')
        new_name = args.get('newName')

        # If this returns none we have an issue
        og = OG.objects.get(token_id=token_id) if OG.objects.filter(token_id=token_id).exists() else None

        if og:
            name_og(token_id, new_name)

    EventLog.objects.create(transaction_hash=transaction_hash, type=event_name)
    return
