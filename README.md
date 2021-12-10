## About Zoobreak

Zoobreak is an innovative NFT project that aims to drive the space forward by utilizing a unique mix of on- and off-chain elements. 

We use the unque possibilities presented by a traditional off-chain server side setup interacting with on-chain data to provide an immersive and rewarding experience for players. 

## TODO

- [X] define the birth function with name change - can be called at any time
- [X] wallet model in back-end (connect to Discord and email address)
- [X] set up test server
- [X] set up test front-end
- [X] deploy to test net
- [X] event watching for mint & name change on server -> update models accordingly
- [X] define actions, handlers for the models, and action objects for these updates
- [X] create .js snippet for front end team to send signed actions
- [ ] research Twitter API for integration when giraffes die
- [ ] create Discord bot to track points and push this to the server
- [ ] setup Pinata account to store IPFS metadata
- [X] ask matteo to buy a ledger hardware wallet for committing to chain (Silvan has one)
- [ ] setup Postgresql DB service
- [ ] integrate email newsletter program into backend so that user registrations can be added to the newsletter as well as connected to their discord account
- [X] smart contract changes
  - [X] name change functionality
  - [X] individual metadata swap (for both name change and death)
- [X] create ERC-20 companion token

## Architecture

### Authorization

```
                                    Chain

                             ┌────┐ ┌────┐ ┌────┐
                             │    │ │    │ │    │
                             │    │ │    │ │    │
                             └────┘ └────┘ └────┘

                                     ▲  │
                            2. Query │  │ 3. Get
                               chain │  │    response
                                     │  │
                              ┌──────┴──▼──────┐
                              │                │
                              │                │   4. Determine if user
            1. Request        │                │      authorized and if
        ──────────────────────►                │      action logical
Client                        │    Server      │
        ◄─────────────────────┤                │
            6. Response       │                │   5. Perform off-chain DB
                              │                │      updates as required
                              │                │
                              └────────────────┘
```

### Mint

```
                                    Chain

   4. Submit mint to chain   ┌────┐ ┌────┐ ┌────┐
  ┌─────────────────────────►│    │ │    │ │    │   5. Smart contract validates
  │                          │    │ │    │ │    │      server-side generated hash
  │                          └────┘ └────┘ └────┘      and mints token
  │
  │
  │
  │
  │
  │                           ┌────────────────┐
  │                           │                │
  │     1. Request pre-mint   │                │
  │        authorization      │                │  2. Pre-sign server-side
        ──────────────────────►                │     message and hash
Client                        │    Server      │
        ◄─────────────────────┤                │
                              │                │
        3. Return hashed      │                │
           message            │                │
                              └────────────────┘




BENEFITS:   1. No gas wars
            2. Bots reduced - fair distribution
            3. Easily distribute mints between separate rounds


Inspired by SVS @WOOF
```

## API Spec

Coming soon

## Setup

### Server Setup

- Clone the repo
- Install dependencies `pip install -r requirements.txt`
- Make an `.env` file and set vars in accordance with `.env.example`. See below for more info
- Run initial migrations `python manage.py makemigrations` & `python manage.py migrate`
- You should now to be able to run the server `python manage.py runserver`
- Send a POSTMAN GET request to `localhost:8000/ping/`. You should receive the following: `"Successfully Got Some Data"`. Congratulations the server is running

### ENV Vars

- `DEBUG` : Set to `True` for development
- `SECRET_KEY` : Generate a random secret key with python or other means. For development a random string from your keyboard is fine
- `RPC_PROVIDER` : Set to `http://127.0.0.1:8545` for local development. See below hardhat section
- `PRIVATE_KEY` : The private key of the server. For local development use a hardhat generated private key
- `CONTRACT_ADDRESS` : The address of the ZOOBREAK contract. Hardhat will provide the deployed address upon contract deploy
- `ABI` : The contract ABI, also provided by hardhat

### Hardhat 

Hardhat mimics a public blockchain on your private machine for development.
In the `./chain` directory, run `npx hardhat run node` to start a local node. This is a local blockchain. 
Hardhat will also generate 20 public/private key pairs, and you should choose one (probably the first) for the `PRIVATE_KEY` variable above.

Open another terminal, navigate again to `./chain` and run `npx run ./scripts/deploy.js`. 
Hardhat will compile the contracts and deploy them to your local node.
You can use the provided contract deployment address for `CONTRACT_ADDRESS` above.

Finally, you need to copy the string version of the ABI. Hardhat will generate the ABI on compilation and store it in the `contracts` subdirectory.
Find the relevant file `XXX.json` and copy the ABI as a string for the `ABI` env var. (everything between the brackets, including the brackets, in `"abi": [ .. ]`)

Hardhat also requires a few env vars that are privately maintained, contact the project maintainer for these.
