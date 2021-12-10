const { expect } = require("chai");
const { ethers } = require("hardhat");

const { getMintRequest, getLoveRequest} = require("../utils/mockSigner")

const getRemoteContent = require('remote-content');

describe("ZooBreak", function () {

    let ZOO;
    let zoo;

    let LOVE;
    let love;

    let owner;
    let addr1;
    let addr2;
    let addrs;

    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        ZOO = await ethers.getContractFactory("ZOO");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        // To deploy our contract, we just have to call Token.deploy() and await
        // for it to be deployed(), which happens once its transaction has been
        // mined.
        zoo = await ZOO.deploy();
        const zooAddress = zoo.address

        LOVE = await ethers.getContractFactory("LOVE");
        love = await LOVE.deploy(zooAddress);
        const loveAddress = love.address

        await zoo.setLoveToken(loveAddress)
    });

    describe("Whitelisting", function () {
        // If the callback function is async, Mocha will `await` it.
        it("should add a single address to the presale list", async function () {
            const address = await addr1.getAddress();
            const entries = [address]

            await zoo.addToPresaleList(entries)
            expect(await zoo.presalerList(address)).to.equal(true)
            expect(await zoo.isPresaler(address)).to.equal(true)
        })

        it("should add multiple addresses to the presale list", async function () {
            const address1 = await addr1.getAddress();
            const address2 = await addr2.getAddress();
            const entries = [address1, address2]

            await zoo.addToPresaleList(entries)
            expect(await zoo.presalerList(address1)).to.equal(true)
            expect(await zoo.presalerList(address2)).to.equal(true)

            expect(await zoo.isPresaler(address1)).to.equal(true)
            expect(await zoo.isPresaler(address2)).to.equal(true)
        })

        it("should get a default false for a non-added address", async function () {
            const address = await addr1.getAddress();

            expect(await zoo.presalerList(address)).to.equal(false)
            expect(await zoo.presalerList(address)).to.equal(false)
        })

        it("should disallow adding the null address to the presale list", async function () {
            const address = ethers.constants.AddressZero
            const entries = [address]

            await expect(zoo.addToPresaleList(entries)).to.be.revertedWith("NULL_ADDRESS")
        })

        it("should disallow adding a duplicate to the presale list", async function () {
            const address = await addr1.getAddress();
            const entries = [address]

            await zoo.addToPresaleList(entries)
            await expect(zoo.addToPresaleList(entries)).to.be.revertedWith("DUPLICATE_ENTRY")
        })

        it("should remove a single address from the presale list", async function () {
            const address = await addr1.getAddress();
            const entries = [address]

            expect(await zoo.presalerList(address)).to.equal(false)
            expect(await zoo.isPresaler(address)).to.equal(false)

            await zoo.addToPresaleList(entries)
            expect(await zoo.presalerList(address)).to.equal(true)
            expect(await zoo.isPresaler(address)).to.equal(true)

            await zoo.removeFromPresaleList(entries)
            expect(await zoo.presalerList(address)).to.equal(false)
            expect(await zoo.isPresaler(address)).to.equal(false)
        })

        it("should remove multiple addresses to the presale list", async function () {
            const address1 = await addr1.getAddress();
            const address2 = await addr2.getAddress();
            const entries = [address1, address2]

            expect(await zoo.presalerList(address1)).to.equal(false)
            expect(await zoo.presalerList(address2)).to.equal(false)
            expect(await zoo.isPresaler(address1)).to.equal(false)
            expect(await zoo.isPresaler(address2)).to.equal(false)

            await zoo.addToPresaleList(entries)
            expect(await zoo.presalerList(address1)).to.equal(true)
            expect(await zoo.presalerList(address2)).to.equal(true)
            expect(await zoo.isPresaler(address1)).to.equal(true)
            expect(await zoo.isPresaler(address2)).to.equal(true)

            await zoo.removeFromPresaleList(entries)
            expect(await zoo.presalerList(address1)).to.equal(false)
            expect(await zoo.presalerList(address2)).to.equal(false)
            expect(await zoo.isPresaler(address1)).to.equal(false)
            expect(await zoo.isPresaler(address2)).to.equal(false)
        })

        it("should disallow removing the null address to the presale list", async function () {
            const address = ethers.constants.AddressZero
            const entries = [address]

            await expect(zoo.removeFromPresaleList(entries)).to.be.revertedWith("NULL_ADDRESS")
        })

        it("should disallow adding to the pre-sale list from non-owner accounts", async function () {
            const address = await addr1.getAddress();
            const entries = [address]

            await expect(zoo.connect(addr1).addToPresaleList(entries)).to.be.revertedWith("Ownable: caller is not the owner")
        })

        it("should disallow removing from the pre-sale list from non-owner accounts", async function () {
            const address = await addr1.getAddress();
            const entries = [address]

            await expect(zoo.connect(addr1).removeFromPresaleList(entries)).to.be.revertedWith("Ownable: caller is not the owner")
        })
    });

    describe("Presale Buying", function () {
        it("should revert is presale is not live", async function () {
            const zoo_price = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1

            await zoo.addToPresaleList([sender])

            await expect(zoo.presaleBuy(quantity, {
                value: ethers.utils.parseEther(zoo_price)
            })).to.be.revertedWith("PRESALE_CLOSED")
        });

        it("should revert if sale is live", async function () {
            await zoo.toggleSaleStatus();
            await zoo.togglePresaleStatus();
            const zoo_price = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1

            await zoo.addToPresaleList([sender])

            await expect(zoo.presaleBuy(quantity, {
                value: ethers.utils.parseEther(zoo_price)
            })).to.be.revertedWith("PRESALE_CLOSED")

            expect(await zoo.presaleLive()).to.equal(true)
        });

        it("should disallow pre-sale buying if not qualified", async function () {
            await zoo.togglePresaleStatus();
            const zoo_price = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const quantity = 1

            await expect(zoo.presaleBuy(quantity, {
                value: ethers.utils.parseEther(zoo_price)
            })).to.be.revertedWith("NOT_QUALIFIED")
        });

        // No coverage for OUT_OF_STOCK
        // No coverage for EXCEED_PRIVATE

        it("should successfully purchase in the pre-sale", async function () {
            await zoo.togglePresaleStatus();
            const zoo_price = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1

            await zoo.addToPresaleList([sender])

            await zoo.presaleBuy(quantity, {
                value: ethers.utils.parseEther(zoo_price)
            })

            expect(await zoo.privateAmountMinted()).to.equal(1)
            expect(await zoo.presalerListPurchases(sender)).to.equal(1)
            expect(await zoo.presalePurchasedCount(sender)).to.equal(1)
            expect(await zoo.ownerOf(1)).to.equal(sender)
        });

        it("should revert if a buyer attempts to buy more than the individual pre-sale allocation", async function () {
            await zoo.togglePresaleStatus();
            const zoo_price = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1

            await zoo.addToPresaleList([sender])

            for (var i=0; i<2; i++) {
                await zoo.presaleBuy(quantity, {
                    value: ethers.utils.parseEther(zoo_price)
                })
            }

            await expect(zoo.presaleBuy(quantity, {
                value: ethers.utils.parseEther(zoo_price)
            })).to.be.revertedWith("EXCEED_ALLOC")
        });

        it("should revert if a buyer attempts to buy more than the individual pre-sale allocation in one go", async function () {
            await zoo.togglePresaleStatus();
            const zoo_price = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 3

            await zoo.addToPresaleList([sender])

            await expect(zoo.presaleBuy(quantity, {
                value: ethers.utils.parseEther(zoo_price)
            })).to.be.revertedWith("EXCEED_ALLOC")
        });

        it("should revert if a buyer attempts to buy with insufficient eth", async function () {
            await zoo.togglePresaleStatus();
            const insufficientZooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE().then(r => r.div(2)));

            const sender = await owner.getAddress()
            const quantity = 1

            await zoo.addToPresaleList([sender])

            await expect(zoo.presaleBuy(quantity, {
                value: ethers.utils.parseEther(insufficientZooPrice)
            })).to.be.revertedWith("INSUFFICIENT_ETH")
        });

        it("should revert if a buyer attempts to buy with insufficient eth for multiple", async function () {
            await zoo.togglePresaleStatus();
            const zoo_price = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 2

            await zoo.addToPresaleList([sender])

            await expect(zoo.presaleBuy(quantity, {
                value: ethers.utils.parseEther(zoo_price)
            })).to.be.revertedWith("INSUFFICIENT_ETH")
        });
    });

    describe("Gifting", function () {
        // No coverage for MAX_MINT
        // No coverage for GIFTS_EMPTY

        it("should gift one recipient", async function () {
            const recipient = await addr1.getAddress()
            const recipients = [ recipient ]

            await zoo.gift(recipients)
            expect(await zoo.ownerOf(1)).to.equal(recipient)
        });

        it("should gift multiple recipients", async function () {
            const recipient1 = await addr1.getAddress()
            const recipient2 = await addr2.getAddress()
            const recipients = [ recipient1, recipient2 ]

            await zoo.gift(recipients)
            expect(await zoo.ownerOf(1)).to.equal(recipient1)
            expect(await zoo.ownerOf(2)).to.equal(recipient2)
        });

        it("should disallow calling the gift function if not the owner", async function () {
            const recipient = await addr1.getAddress()
            const recipients = [ recipient ]

            await expect(zoo.connect(addr1).gift(recipients)).to.be.revertedWith("Ownable: caller is not the owner")
        })

    });

    describe("Buying", function () {
        it("should disallow buying if sale is closed", async function () {
            const zoo_price = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, 1)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await expect(zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zoo_price)
            })).to.be.revertedWith("SALE_CLOSED")
        });

        it("should disallow buying if the presale is live, and the sale is open", async function () {
            await zoo.togglePresaleStatus(); // Live
            await zoo.toggleSaleStatus(); // Live

            const zoo_price = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, 1)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await expect(zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zoo_price)
            })).to.be.revertedWith("ONLY_PRESALE")
        });

        it("should disallow buying if signature does not come from our server", async function () {
            await zoo.toggleSaleStatus();
            const zoo_price = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, 1, true)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await expect(zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zoo_price)
            })).to.be.revertedWith("DIRECT_MINT_DISALLOWED")
        });

        it("should disallow buying if signature hash has been duplicated", async function () {
            await zoo.toggleSaleStatus();
            const zoo_price = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, 1, false, true)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zoo_price)
            })

            await expect(zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zoo_price)
            })).to.be.revertedWith("HASH_USED")
        });

        it("should disallow buying if any of the arguments don't match the hash", async function () {
            await zoo.toggleSaleStatus();
            const zoo_price = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, 1)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            // Bad sender
            await expect(zoo.connect(addr1).buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zoo_price)
            })).to.be.revertedWith("HASH_FAIL")

            // Bad quantity
            const badQuantity = 2;
            await expect(zoo.buy(hash, signature, badQuantity, nonce, {
                value: ethers.utils.parseEther(zoo_price)
            })).to.be.revertedWith("HASH_FAIL")

            // Bad nonce
            const badNonce = "badNonce";
            await expect(zoo.buy(hash, signature, quantity, badNonce, {
                value: ethers.utils.parseEther(zoo_price)
            })).to.be.revertedWith("HASH_FAIL")
        });

        // No coverage for OUT_OF_STOCK
        // No coverage for EXCEED_PUBLIC

        it("should disallow more purchases per mint than allowed", async function () {
            await zoo.toggleSaleStatus();
            const zoo_price = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 6
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await expect(zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zoo_price).mul(quantity)
            })).to.be.revertedWith("EXCEED_ZOO_PER_MINT")
        })

        it("should buy a single token", async function () {
            await zoo.toggleSaleStatus();
            const zoo_price = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zoo_price)
            })

            expect(await zoo.ownerOf(1)).to.equal(sender)
            expect(await zoo.totalSupply()).to.equal(quantity)
            expect(await zoo.publicAmountMinted()).to.equal(quantity)
        });

        it("should buy a multiple tokens", async function () {
            await zoo.toggleSaleStatus();
            const zoo_price = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 5
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zoo_price).mul(quantity)
            })

            for (var i=1; i<=quantity; i++) {
                expect(await zoo.ownerOf(i)).to.equal(sender)
            }
            expect(await zoo.totalSupply()).to.equal(quantity)
            expect(await zoo.publicAmountMinted()).to.equal(quantity)
        });

        it("should buy a single token and then another after a price change", async function () {
            await zoo.toggleSaleStatus();
            const zoo_price = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            let mintRequest = await getMintRequest(sender, quantity)

            let hash = mintRequest.hash
            let signature = mintRequest.signature
            let nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zoo_price)
            })

            expect(await zoo.ownerOf(1)).to.equal(sender)
            expect(await zoo.totalSupply()).to.equal(quantity)
            expect(await zoo.publicAmountMinted()).to.equal(quantity)

            await zoo.setPrice(ethers.utils.parseEther("0.10"))
            const newZooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            mintRequest = await getMintRequest(sender, quantity)

            hash = mintRequest.hash
            signature = mintRequest.signature
            nonce = mintRequest.nonce

            await expect(zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zoo_price)
            })).to.be.revertedWith("INSUFFICIENT_ETH")

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(newZooPrice)
            })

            expect(await zoo.ownerOf(2)).to.equal(sender)
            expect(await zoo.totalSupply()).to.equal(quantity * 2)
            expect(await zoo.publicAmountMinted()).to.equal(quantity * 2)
        });

        it("should disallow a purchase fur a single token with insufficient eth", async function () {
            await zoo.toggleSaleStatus();
            const zoo_price = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await expect(zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zoo_price).div(2)
            })).to.be.revertedWith("INSUFFICIENT_ETH")
        })

        it("should disallow purchases fur a multiple tokens with insufficient eth", async function () {
            await zoo.toggleSaleStatus();
            const zoo_price = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 3
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            // Verify our math here
            expect(ethers.utils.parseEther(zoo_price).mul(quantity).sub(ethers.utils.parseEther(zoo_price))).to.equal(ethers.utils.parseEther(zoo_price).mul(2))

            await expect(zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zoo_price).mul(quantity).sub(ethers.utils.parseEther(zoo_price))
            })).to.be.revertedWith("INSUFFICIENT_ETH")
        })
    });

    describe("Name Change", function () {
        it("should mint and check ownership", async function () {
            await zoo.toggleSaleStatus();
            const zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zooPrice)
            })

            await expect(await zoo.ownerOf(1)).to.equal(sender)
            await expect(await zoo.totalSupply().then(r => r.toNumber())).to.equal(1)
        })

        it("should verify that name is null", async function () {
            await zoo.toggleSaleStatus();
            const zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zooPrice)
            })

            expect(await zoo.tokenNameByIndex(1)).to.equal("")
        })

        it("should verify that hasBeenNamed is false", async function () {
            await zoo.toggleSaleStatus();
            const zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zooPrice)
            })

            expect(await zoo.hasBeenNamed(1)).to.equal(false)
        })

        it("should change the name", async function () {
            await zoo.toggleSaleStatus();
            const zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zooPrice)
            })

            const newName = "McJagger"
            await zoo.changeName(1, newName)
            expect(await zoo.tokenNameByIndex(1)).to.equal(newName)
        })

        it("should verify the hasBeenNamed is true after change", async function () {
            await zoo.toggleSaleStatus();
            const zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zooPrice)
            })

            const newName = "McJagger"
            await zoo.changeName(1, newName)
            expect(await zoo.hasBeenNamed(1)).to.equal(true)
        })

        it("should verify the isNameReserved is true after change", async function () {
            await zoo.toggleSaleStatus();
            const zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zooPrice)
            })

            const newName = "McJagger"
            await zoo.changeName(1, newName)
            expect(await zoo.isNameReserved(newName)).to.equal(true)
        })

        it("should disallow a different wallet to name the token", async function () {
            await zoo.toggleSaleStatus();
            const zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zooPrice)
            })

            const newName = "McJagger"
            await expect(zoo.connect(addr1).changeName(1, newName)).to.be.revertedWith('ERC721: caller is not the owner');
        })

        it("should disallow a user to change their name twice", async function () {
            await zoo.toggleSaleStatus();
            const zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zooPrice)
            })

            const newName = "McJagger"
            await zoo.changeName(1, newName)
            expect(await zoo.hasBeenNamed(1)).to.equal(true)

            const secondNewName = "Mickey Mouse"
            await expect(zoo.changeName(1, secondNewName)).to.be.revertedWith('Token already named');
        })

        it("should disallow naming to an invalid name", async function () {
            await zoo.toggleSaleStatus();
            const zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zooPrice)
            })

            var invalidNewName = "McJagger!"
            await expect(zoo.changeName(1, invalidNewName)).to.be.revertedWith('Not a valid new name');

            invalidNewName = ""
            await expect(zoo.changeName(1, invalidNewName)).to.be.revertedWith('Not a valid new name');

            invalidNewName = "McJagger "
            await expect(zoo.changeName(1, invalidNewName)).to.be.revertedWith('Not a valid new name');

            invalidNewName = " McJagger"
            await expect(zoo.changeName(1, invalidNewName)).to.be.revertedWith('Not a valid new name');

            invalidNewName = "Mc  Jagger"
            await expect(zoo.changeName(1, invalidNewName)).to.be.revertedWith('Not a valid new name');

            invalidNewName = "ThisIsLongerThan25Characters"
            await expect(zoo.changeName(1, invalidNewName)).to.be.revertedWith('Not a valid new name');
        })

        it("should disallow naming to an already taken name", async function () {
            await zoo.toggleSaleStatus();
            const zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zooPrice)
            })

            const newName = "McJagger"
            await zoo.changeName(1, newName);

            const sender_2 = await addr1.getAddress()
            const quantity_2 = 1
            const mintRequest_2 = await getMintRequest(sender_2, quantity_2)

            const hash_2 = mintRequest_2.hash
            const signature_2 = mintRequest_2.signature
            const nonce_2 = mintRequest_2.nonce

            await zoo.connect(addr1).buy(hash_2, signature_2, quantity_2, nonce_2, {
                value: ethers.utils.parseEther(zooPrice)
            })

            await expect(zoo.connect(addr1).changeName(2, newName)).to.be.revertedWith('Name already reserved');
        })

        it("should verify toLower", async function () {
            const providedString = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789"
            expect(await zoo.toLower(providedString)).to.equal(providedString.toLowerCase())
        })
    })

    describe("Live & Die Functionality", function () {
        it("should mint and default to alive", async function () {
            await zoo.toggleSaleStatus();
            const zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zooPrice)
            })

            expect(await zoo.isTokenDeceased(1)).to.equal(false)
        })

        it("should purge and return true for isDeceased", async function () {
            await zoo.toggleSaleStatus();
            const zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zooPrice)
            })

            await zoo.purge(1, "starvation")
            expect(await zoo.isTokenDeceased(1)).to.equal(true)
        })

        it("should disallow purging from non-signer addresses", async function () {
            await zoo.toggleSaleStatus();
            const zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zooPrice)
            })

            await expect(zoo.connect(addr1).purge(1, "starvation")).to.be.revertedWith('Signer only function');
        })

        it("should disallow purging if metadata is locked", async function () {
            await zoo.toggleSaleStatus();
            const zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zooPrice)
            })

            await zoo.lockMetadata();
            await expect(zoo.purge(1, "starvation")).to.be.revertedWith('Contract metadata methods are locked');
        })

        it("should show deceased after purging, and then show not deceased after revival", async function () {
            await zoo.toggleSaleStatus();
            const zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());
            const zooRevivePrice = ethers.utils.formatEther(await zoo.ZOO_REVIVE_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zooPrice)
            })

            await zoo.purge(1, "starvation")
            expect(await zoo.isTokenDeceased(1)).to.equal(true)

            await zoo.revive(1, {
                value: ethers.utils.parseEther(zooRevivePrice)
            })
            expect(await zoo.isTokenDeceased(1)).to.equal(false)
        })

        it("should allow non-owner altruistic revivals", async function () {
            await zoo.toggleSaleStatus();
            const zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());
            const zooRevivePrice = ethers.utils.formatEther(await zoo.ZOO_REVIVE_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zooPrice)
            })

            await zoo.purge(1, "starvation")
            expect(await zoo.isTokenDeceased(1)).to.equal(true)

            await zoo.connect(addr1).revive(1, {
                value: ethers.utils.parseEther(zooRevivePrice)
            })
            expect(await zoo.isTokenDeceased(1)).to.equal(false)
        })

        it("should disallow revival if OG is not deceased", async function () {
            await zoo.toggleSaleStatus();
            const zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());
            const zooRevivePrice = ethers.utils.formatEther(await zoo.ZOO_REVIVE_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zooPrice)
            })

            const revive = zoo.revive(1, {
                value: ethers.utils.parseEther(zooRevivePrice)
            })
            await expect(revive).to.be.revertedWith('OG is not deceased');
        })

        it("should disallow revival if insufficient ether provided", async function () {
            await zoo.toggleSaleStatus();
            const zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());
            const insufficientZooRevivePrice = ethers.utils.formatEther(await zoo.ZOO_REVIVE_PRICE().then(r => r.div(2)));

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zooPrice)
            })

            await zoo.purge(1, "starvation")
            expect(await zoo.isTokenDeceased(1)).to.equal(true)

            const revive = zoo.revive(1, {
                value: ethers.utils.parseEther(insufficientZooRevivePrice)
            })
            await expect(revive).to.be.revertedWith('INSUFFICIENT_ETH');
        })
    })

    describe("MGMT: Withdrawal", function () {
        it("should receive initial mint price", async function () {
            const initialBalance = await owner.getBalance();

            // Buy a single token from another account
            await zoo.toggleSaleStatus();
            const zoo_price = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await addr1.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.connect(addr1).buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zoo_price)
            })

            await zoo.withdraw()
            const subsequentBalance = await owner.getBalance();

            expect(subsequentBalance.gt(initialBalance)).to.equal(true);
        })
    })

    describe("MGMT: Pricing", function () {
        it("should receive initial mint price", async function () {
            expect(await zoo.ZOO_PRICE()).to.equal(ethers.utils.parseEther("0.05"))
        })

        it("should update the mint price to the new value", async function () {
            await zoo.setPrice(ethers.utils.parseEther("1.05"));
            expect(await zoo.ZOO_PRICE()).to.equal(ethers.utils.parseEther("1.05"))
        })

        it("should integration test the new mint price by rejecting mints below new price", async function () {
            await zoo.toggleSaleStatus();
            const first_zoo_price = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            let mintRequest = await getMintRequest(sender, 1)

            let hash = mintRequest.hash
            let signature = mintRequest.signature
            let nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(first_zoo_price)
            })

            expect(await zoo.ownerOf(1)).to.equal(sender)

            // Set new price
            await zoo.setPrice(ethers.utils.parseEther("1.05"));
            const second_zoo_price = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            mintRequest = await getMintRequest(sender, 1)

            hash = mintRequest.hash
            signature = mintRequest.signature
            nonce = mintRequest.nonce

            await expect(zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(first_zoo_price)
            })).to.be.revertedWith("INSUFFICIENT_ETH")

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(second_zoo_price)
            })

            expect(await zoo.ownerOf(2)).to.equal(sender)
        })

        it("should disallow changing the price from non-signer addresses", async function () {
            await expect(zoo.connect(addr1).setPrice(ethers.utils.parseEther("1.05"))).to.be.revertedWith("Signer only function")
        })

        it("should receive initial revive price", async function () {
            expect(await zoo.ZOO_REVIVE_PRICE()).to.equal(ethers.utils.parseEther("0.05"))
        })

        it("should update the revive price to the new value", async function () {
            await zoo.setRevivePrice(ethers.utils.parseEther("1.22"));
            expect(await zoo.ZOO_REVIVE_PRICE()).to.equal(ethers.utils.parseEther("1.22"))
        })

        it("should disallow changing the revive price from non-signer addresses", async function () {
            await expect(zoo.connect(addr1).setRevivePrice(ethers.utils.parseEther("1.05"))).to.be.revertedWith("Signer only function")
        })
    })

    describe("MGMT: Misc & URI", function () {
        it("should toggle lock", async function () {
            expect(await zoo.locked()).to.equal(false)

            await zoo.lockMetadata()
            expect(await zoo.locked()).to.equal(true)
        });

        it("should toggle presale", async function () {
            expect(await zoo.presaleLive()).to.equal(false)

            await zoo.togglePresaleStatus()
            expect(await zoo.presaleLive()).to.equal(true)
        });

        it("should toggle sale", async function () {
            expect(await zoo.saleLive()).to.equal(false)

            await zoo.toggleSaleStatus()
            expect(await zoo.saleLive()).to.equal(true)
        });

        it("should change the signer address and verify with a method call", async function () {
            const newSignerAddress = await addr1.getAddress()
            await zoo.setSignerAddress(newSignerAddress)

            // This method is only signer
            await zoo.connect(addr1).setPrice(ethers.utils.parseEther("1.05"));
            expect(await zoo.ZOO_PRICE()).to.equal(ethers.utils.parseEther("1.05"))
        });

        it("should change the signer address, verify the owner is no longer signer, and then revert the signer to the owner again", async function () {
            const oldSignerAddress = await owner.getAddress()
            const newSignerAddress = await addr1.getAddress()
            await zoo.setSignerAddress(newSignerAddress)

            // This method is only signer
            await expect(zoo.setPrice(ethers.utils.parseEther("1.05"))).to.be.revertedWith("Signer only function")

            await zoo.setSignerAddress(oldSignerAddress)
            await zoo.setPrice(ethers.utils.parseEther("1.05"));
            expect(await zoo.ZOO_PRICE()).to.equal(ethers.utils.parseEther("1.05"))
        });

        it("should set the provenance hash", async function () {
            expect(await zoo.proof()).to.equal("")

            await zoo.setProvenanceHash("TESTHASH");
            expect(await zoo.proof()).to.equal("TESTHASH")
        })

        it("should not allow non-owners to set the provenance hash", async function () {
            await expect(zoo.connect(addr1).setProvenanceHash("TESTHASH")).to.be.revertedWith("Ownable: caller is not the owner")
        })

        it("should not allow someone to set the provenance hash if the contract is locked", async function () {
            await zoo.lockMetadata();
            await expect(zoo.setProvenanceHash("TESTHASH")).to.be.revertedWith("Contract metadata methods are locked")
        })

        it("should set the contract URI", async function () {
            expect(await zoo.contractURI()).to.equal("")

            await zoo.setContractURI("https://www.example.com");
            expect(await zoo.contractURI()).to.equal("https://www.example.com")
        })

        it("should disallow non-owners to set the contract URI", async function () {
            await expect(zoo.connect(addr1).setContractURI("https://www.example.com")).to.be.revertedWith("Ownable: caller is not the owner")
        })

        it("should disallow someone to set the contractURI if the contract is locked", async function () {
            await zoo.lockMetadata();
            await expect(zoo.setContractURI("https://www.example.com")).to.be.revertedWith("Contract metadata methods are locked")
        })

        it("should set the token base URI", async function () {
            await zoo.toggleSaleStatus();
            const zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zooPrice)
            })

            expect(await zoo.tokenURI(1)).to.equal("https://zoobreak.xyz/api/metadata/1")

            await zoo.setBaseURI("https://www.example.com/");
            expect(await zoo.tokenURI(1)).to.equal("https://www.example.com/1")
        })

        it("should disallow non-owners to set the token base URI", async function () {
            await expect(zoo.connect(addr1).setBaseURI("https://www.example.com/")).to.be.revertedWith("Ownable: caller is not the owner")
        })

        it("should disallow to set the token base URI when the metadata is locked", async function () {
            await zoo.lockMetadata();
            await expect(zoo.setBaseURI("https://www.example.com/")).to.be.revertedWith("Contract metadata methods are locked")
        })

        it("should disallow querying a tokenURI that does not exist", async function () {
            await expect(zoo.tokenURI(1)).to.be.revertedWith("Cannot query non-existent token")
        })

        it("should correctly return the deceased uri if token is deceased", async function () {
            await zoo.toggleSaleStatus();
            const zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());
            const zooRevivePrice = ethers.utils.formatEther(await zoo.ZOO_REVIVE_PRICE());

            const sender = await owner.getAddress()
            const quantity = 1
            const mintRequest = await getMintRequest(sender, quantity)

            const hash = mintRequest.hash
            const signature = mintRequest.signature
            const nonce = mintRequest.nonce

            await zoo.buy(hash, signature, quantity, nonce, {
                value: ethers.utils.parseEther(zooPrice)
            })

            expect(await zoo.tokenURI(1)).to.equal("https://zoobreak.xyz/api/metadata/1")

            await zoo.purge(1, "starvation");
            expect(await zoo.tokenURI(1)).to.equal("https://zoobreak.xyz/api/metadata/1/deceased")

            await zoo.revive(1, {
                value: ethers.utils.parseEther(zooRevivePrice)
            })

            expect(await zoo.tokenURI(1)).to.equal("https://zoobreak.xyz/api/metadata/1")
        })
    })

    describe("LOVE", function () {
        it("should reward love", async function () {
            const sender = await owner.getAddress()
            const amount = ethers.utils.parseEther("10")
            const loveRequest = await getLoveRequest(sender, amount)

            const hash = loveRequest.hash
            const signature = loveRequest.signature
            const nonce = loveRequest.nonce

            await zoo.rewardLove(hash, signature, amount, nonce)
            expect(await love.balanceOf(sender)).to.equal(amount);
        })

        it("should disallow rewarding love if signature does not come from our server", async function () {
            const sender = await owner.getAddress()
            const amount = ethers.utils.parseEther("10")
            const loveRequest = await getLoveRequest(sender, 1, true)

            const hash = loveRequest.hash
            const signature = loveRequest.signature
            const nonce = loveRequest.nonce

            await expect(zoo.rewardLove(hash, signature, amount, nonce)).to.be.revertedWith("DIRECT_PAYOUT_DISALLOWED")
        });

        it("should disallow rewarding love if any of the arguments don't match the hash", async function () {
            const sender = await owner.getAddress()
            const amount = ethers.utils.parseEther("10")
            const loveRequest = await getLoveRequest(sender, amount)

            const hash = loveRequest.hash
            const signature = loveRequest.signature
            const nonce = loveRequest.nonce

            // Bad sender
            await expect(zoo.connect(addr1).rewardLove(hash, signature, amount, nonce)).to.be.revertedWith("HASH_FAIL")

            // Bad quantity
            const badAmount = ethers.utils.parseEther("20")
            await expect(zoo.rewardLove(hash, signature, badAmount, nonce)).to.be.revertedWith("HASH_FAIL")

            // Bad nonce
            const badNonce = "badNonce";
            await expect(zoo.rewardLove(hash, signature, amount, badNonce)).to.be.revertedWith("HASH_FAIL")
        });
    })
});