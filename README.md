## About Zoobreak

Zoobreak is an innovative NFT project that aims to drive the space forward by utilizing a unique mix of on- and off-chain elements. 

We use the unque possibilities presented by a traditional off-chain server side setup interacting with on-chain data to provide an immersive and rewarding experience for players. 

## Setup

The repo is organised in the following manner:

```
zoobreak
 |-- chain // the contract implementations
 |-- front-end // the demo-site code
 |-- server // the back-end signing server
 README.md (this file)
```

We will detail appropriate setup for each portion.

## Blockchain Setup & Contract Deployment

```
zoobreak
 |-- chain // the contract implementations
```

First we need to set appropriate env vars. Copy the `.env.example` file to `.env` and take note of the following variables:

- `RINKEBY_DEPLOYMENT_RPC_URL` RPC URL for Rinkeby network deployment
- `RINKEBY_DEPLOYMENT_PRIVATE_KEY` Private key of signer to deploy to Rinkeby
- `CONTRACT_ADDRESS` Referenced throughout many of the scripts to connect to the deployed contract address, in our case on Rinkeby. Modify to your own needs
- `UZH_DEPLOYMENT_RPC_URL` Useful for deploying to the UZHETH network
- `LOCAL_CONTRACT_ADDRESS` References the contract address on the local hardhat network (see below)
- `SIGNER_ADDRESS` Address of the contract signer -> used by some of the scripts to set the signer variable in the contract
- `PRIVATE_KEY` Used by many of the scripts to initiate a signer to interact with the deployed contract
- `TAMPER_PRIVATE_KEY` A throwaway private key used in the test scripts to simulate a signature that has been tampered with
- `PUBLIC_KEY` Referenced throughout the scripts in a one-off fashion

Most of the environment variables here don't have a great impact on the overall system are not required to deploy, 
and as such you can leave most of them blank if you don't intend to interact with the contract from the command line or run the tests.
(The server-side variables are comparably more important)
What's important is that you can deploy the contracts. 

### Deploy

To deploy the contracts, navigate in the terminal to the `chain` directory, and run `npm install`.

Note in the `hardhat.config.js` file the following portion:
```
 networks: {
      hardhat: {},
      rinkeby: {
         url: RINKEBY_DEPLOYMENT_RPC_URL,
         accounts: [`${RINKEBY_DEPLOYMENT_PRIVATE_KEY}`]
      },
      uzh: {
          url: UZH_DEPLOYMENT_RPC_URL,
          accounts: [`${PRIVATE_KEY}`]
      }
   },
```
At this point you will need to set these env variables or delete the `rinkeby` & `uzh` objects within the `network` object. Once that is complete, run the following command `npx hardhat node`. Congratulations, you have a running blockchain on your local computer.

In a separate terminal, return to the `chain` directory and run the following command: `npx hardhat run ./scripts/deploy.js`. Hardhat should deploy the contracts correctly (the love.sol contract depends on the zoobreak.sol contract) and output their addresses to the command line. 

Congratulations, you just successfully deployed! To deploy to another network, simply re-run the above command with the `--network <network>` argument. Note that this network will need to be defined in your config as demonstrated above.

You may want to copy the `abi` portion of the `ZOO.json` file generated by the hardhat compiler at `chain/artifacts/contracts/zoobreak.sol/ZOO.json`.

## Server Setup

```
zoobreak
  |-- server // the back-end signing server
```

Now we will install, configure, and launch the signing server. 

The first thing to do is to navigate to the `server` repo and create a virtual environment for our dependencies with the command `python3 -m venv venv`.
Activate the virtual environment with `source venv/bin/activate`. Then run `pip install -r requirements.txt` to install the necessary python dependencies.

Once that hash finished, make an `.env` file in accordance with `.env.example` in the `server/zoobreak/` directory.

You will be required to set the following environment variables:

- `DEBUG` Default is `False`, can be set to `True` for local development. Note never have `DEBUG` set to `True` in a production setting
- `SECRET_KEY` A secret key used by Django for generating cookies. Not relevant for our scenario but required by the library. 
Note that this has no relation to our Web3 wallets, this is a pure Django requirement. Set to a long random alphanumeric phrase. Production deployments should ensure that this key is suitably secure.
- `RPC_PROVIDER` The url of the JSON-RPC used for connecting to the blockchain network. If testing locally, set to `http://127.0.0.1:8545` to connect to the local hardhat node. 
- `ZOO_CONTRACT_ADDRESS` The address of our deployed ZOO contract. This is written to the command line upon deployment by the hardhat `deploy.js` script run above. 
Note that the address should be on the network defined in `RPC_PROVIDER`
- `ZOO_ABI` The contract ABI (Application Binary Interface) that the internal libraries use to connect to the contract deployed on the blockchain. 
Luckily, this value has been predefined by the `.env.example` file as a convenience.
- `PRIVATE_KEY` The private key of the signing server. This key must correspond to the address stored in the `_signerAddress` variable in the ZOO contract. 
The server signs the client messages with this private key and returns them to the client.
- `RANDOM_NONCE_LENGTH` Default 32.
- `ALLOW_MINT_REGISTERED_WALLETS_ONLY` Deprecated, always `True`
- `MAX_ZOO_PER_MINT` Default 5. Should match the value present in the ZOO contract. Only provided as a sanity check for clients.

Once that is complete, you should be able to run (in the `server` directory) the following:

- `python manage.py makemigrations`
- `python manage.py migrate`

Once that is complete, run `python manage.py runserver`. If everything was successful, the server should start right up.
Send a GET request (via cURL or a tool like Postman) to `localhost:8000/api/ping/`. If you see a valid response, then the server is working.

See the API Spec for the server's capabilities.

### Background Tasks

To run the background tasks, you need to initiate the following commands in separate terminal windows:

Run the `celery beat` process: `celery -A zoobreak beat --loglevel=INFO --scheduler django_celery_beat.schedulers:DatabaseScheduler`

Run the `celery worker` process: `celery -A zoobreak worker --loglevel=INFO`

Note that there are a few pre-requisites to get the above to work.

- You will need a running Redis instance. (You are of course free to swap out the message broker for your own - 
the necessary config is in the `server/zoobreak/settings.py` file under `CELERY_BROKER_URL`)
- You will also need to ensure that there is an appropriate "beat" task present in the Database, as this is not created automatically.
You will need to create two tasks at an appropriate interval with the `api.tasks.watch_events` task, one with the `EventType.TRANSFER.value` argument, and one with the `EventType.NAME_CHANGE.value` argument. (see `api.types.EVENT_TYPE`)
See the [docs](https://github.com/celery/django-celery-beat#models) for more information.

As a final note: In a production setting the above tasks should be run as a daemon. See the [Celery docs](https://docs.celeryproject.org/en/stable/userguide/daemonizing.html) for more information.

## Client Demo Setup

```
zoobreak
 |-- front-end // the demo-site code
```

Finally, we turn our attention to the setup of the client demo application. Navigate to the `front-end` directory and run `npm install`.
If you would like to modify the demo application to your own needs, you will need to modify the following constants:

```
// front-end/src/features/tokens/constants.ts

// Change the following to your own API (can be localhost)
export const getAPIEndpoint = (uriAddition: string) => {
  return "https://api.thresholdholdings.com/api" + uriAddition
}
```

```
// front-end/src/chain/contract.ts

// Change the following to your deployed contract address
export const contract = "0xaB0d10fF19d3e3D6d8C6c53439245fdAfC135942";
```

Outside of that the front-end demo is a standard React/Redux application written in Typescript.
Run `npm run start` to start the dev server or `npm run build` to build a production build. 

We include here a few screenshots of the working demo:

![Zoobreak Demo App Image 1](https://github.com/cmbothwell/zoobreak/blob/main/demo_1.png?raw=true)

![Zoobreak Demo App Image 2](https://github.com/cmbothwell/zoobreak/blob/main/demo_2.png?raw=true)

Note that for the demo application to function properly, the user must connect their Metamask wallet. 
The user also **must** be connected to the network where the contract is deployed. In our case this is the **RINKEBY** network.

In the spirit of a proof-of-concept, the demo application only includes rudimentary error handling, and will not warn the user if connected to an incorrect network.

We also graciously thank the [random fox api](https://randomfox.ca/) which we used for the mock metadata. 

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
