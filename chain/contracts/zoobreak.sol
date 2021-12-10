// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/*
    ███████╗ ██████╗  ██████╗ ██████╗ ██████╗ ███████╗ █████╗ ██╗  ██╗
    ╚══███╔╝██╔═══██╗██╔═══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗██║ ██╔╝
      ███╔╝ ██║   ██║██║   ██║██████╔╝██████╔╝█████╗  ███████║█████╔╝
     ███╔╝  ██║   ██║██║   ██║██╔══██╗██╔══██╗██╔══╝  ██╔══██║██╔═██╗
    ███████╗╚██████╔╝╚██████╔╝██████╔╝██║  ██║███████╗██║  ██║██║  ██╗
    ╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝
    ZooBreak / 2021 / V1.0
*/

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./love.sol";

contract ZOO is ERC721Enumerable, Ownable {
    using Strings for uint256;
    using ECDSA for bytes32;

    /***********************************|
    |             VARIABLES             |
    |***********************************/

    uint256 public constant ZOO_GIFT = 100;
    uint256 public constant ZOO_PRIVATE = 900;
    uint256 public constant ZOO_PUBLIC = 9000;
    uint256 public constant ZOO_MAX = ZOO_GIFT + ZOO_PRIVATE + ZOO_PUBLIC;
    uint256 public constant ZOO_PER_MINT = 5;

    uint256 public ZOO_PRICE = 50000000000000000;
    uint256 public ZOO_REVIVE_PRICE = 50000000000000000;

    mapping(address => bool) public presalerList;
    mapping(address => uint256) public presalerListPurchases;
    mapping(string => bool) private _usedNonces;
    mapping(string => bool) private _usedLoveNonces;

    string private _contractURI;
    string private _tokenBaseURI = "https://api.thresholdholdings.com/api/metadata/";
    address private _artistAddress = 0x4d935c609A3137a9fc56c1B75a6A768791aB41D5;
    address private _signerAddress = 0xB39cFc77e3F61dcaDFf126083523730B1B1e9EC1;

    string public proof;
    uint256 public giftedAmount;
    uint256 public publicAmountMinted;
    uint256 public privateAmountMinted;
    uint256 public presalePurchaseLimit = 2;
    bool public presaleLive;
    bool public saleLive;
    bool public locked;

    LOVE public loveToken;

    /***********************************|
    |          TOKEN NAMING             |
    |***********************************/

    // Mapping if certain name string has already been reserved
    mapping (string => bool) private _nameReserved;
    // Mapping from token ID to name
    mapping (uint256 => string) private _tokenName;

    /***********************************|
    |         TOKEN ALIVE/DEAD          |
    |***********************************/

    mapping (uint256 => bool) private _tokenDeceased;

    /***********************************|
    |             EVENTS                |
    |***********************************/

    // Use native ERC-721 'Transfer' event for Transfer
    event NameChange (uint256 indexed tokenId, string newName);
    event OGPurged (uint256 indexed tokenId, string cause);
    event OGRevived (uint256 indexed tokenId, address reviver);

    /***********************************|
    |           MODIFIERS               |
    |***********************************/

    modifier onlySigner() {
        require(msg.sender == _signerAddress, "Signer only function");
        _;
    }

    modifier notLocked {
        require(!locked, "Contract metadata methods are locked");
        _;
    }

    /***********************************|
    |             FUNCTIONS             |
    |***********************************/

    constructor() ERC721("ZooBreak", "ZOO") {}

    function addToPresaleList(address[] calldata entries) external onlyOwner {
        for(uint256 i = 0; i < entries.length; i++) {
            address entry = entries[i];
            require(entry != address(0), "NULL_ADDRESS");
            require(!presalerList[entry], "DUPLICATE_ENTRY");

            presalerList[entry] = true;
        }
    }

    function removeFromPresaleList(address[] calldata entries) external onlyOwner {
        for(uint256 i = 0; i < entries.length; i++) {
            address entry = entries[i];
            require(entry != address(0), "NULL_ADDRESS");

            presalerList[entry] = false;
        }
    }

    function hashTransaction(address sender, uint256 quantity, string memory nonce) private pure returns(bytes32) {
        bytes32 hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n160", abi.encode(sender, quantity, nonce)));
        return hash;
    }

    function matchAddressSigner(bytes32 hash, bytes memory signature) private view returns(bool) {
        return _signerAddress == hash.recover(signature);
    }

    function buy(bytes32 hash, bytes memory signature, uint256 tokenQuantity, string memory nonce) external payable {
        require(saleLive, "SALE_CLOSED");
        require(!presaleLive, "ONLY_PRESALE");

        require(matchAddressSigner(hash, signature), "DIRECT_MINT_DISALLOWED");
        require(!_usedNonces[nonce], "HASH_USED");
        require(hashTransaction(msg.sender, tokenQuantity, nonce) == hash, "HASH_FAIL");

        require(totalSupply() < ZOO_MAX, "OUT_OF_STOCK");
        require(publicAmountMinted + tokenQuantity <= ZOO_PUBLIC, "EXCEED_PUBLIC");
        require(tokenQuantity <= ZOO_PER_MINT, "EXCEED_ZOO_PER_MINT");

        require(ZOO_PRICE * tokenQuantity <= msg.value, "INSUFFICIENT_ETH");

        for(uint256 i = 0; i < tokenQuantity; i++) {
            publicAmountMinted++;
            _safeMint(msg.sender, totalSupply() + 1);
        }

        _usedNonces[nonce] = true;
    }

    function presaleBuy(uint256 tokenQuantity) external payable {
        require(!saleLive && presaleLive, "PRESALE_CLOSED");
        require(presalerList[msg.sender], "NOT_QUALIFIED");
        require(totalSupply() < ZOO_MAX, "OUT_OF_STOCK");
        require(privateAmountMinted + tokenQuantity <= ZOO_PRIVATE, "EXCEED_PRIVATE");
        require(presalerListPurchases[msg.sender] + tokenQuantity <= presalePurchaseLimit, "EXCEED_ALLOC");
        require(ZOO_PRICE * tokenQuantity <= msg.value, "INSUFFICIENT_ETH");

        for (uint256 i = 0; i < tokenQuantity; i++) {
            privateAmountMinted++;
            presalerListPurchases[msg.sender]++;
            _safeMint(msg.sender, totalSupply() + 1);
        }
    }

    function gift(address[] calldata receivers) external onlyOwner {
        require(totalSupply() + receivers.length <= ZOO_MAX, "MAX_MINT");
        require(giftedAmount + receivers.length <= ZOO_GIFT, "GIFTS_EMPTY");

        for (uint256 i = 0; i < receivers.length; i++) {
            giftedAmount++;
            _safeMint(receivers[i], totalSupply() + 1);
        }
    }

    function withdraw() external onlyOwner {
        payable(_artistAddress).transfer(address(this).balance * 1 / 10);
        payable(msg.sender).transfer(address(this).balance);
    }

    function isPresaler(address addr) external view returns (bool) {
        return presalerList[addr];
    }

    function presalePurchasedCount(address addr) external view returns (uint256) {
        return presalerListPurchases[addr];
    }

   /***********************************|
   |            LOVE TOKEN             |
   |***********************************/

    // TODO Check decimal amount // TODO Not locked testing
    function rewardLove(bytes32 hash, bytes memory signature, uint256 _amount, string memory nonce) external notLocked {
        require(matchAddressSigner(hash, signature), "DIRECT_PAYOUT_DISALLOWED");
        require(!_usedLoveNonces[nonce], "HASH_USED");
        require(hashTransaction(msg.sender, _amount, nonce) == hash, "HASH_FAIL");

        loveToken.rewardLove(msg.sender, _amount);
        _usedLoveNonces[nonce] = true;
    }

   /***********************************|
   |     NAME CHANGE FUNCTIONALITY     |
   |***********************************/

    function tokenNameByIndex(uint256 tokenId) public view returns (string memory) {
        return _tokenName[tokenId];
    }

    function hasBeenNamed(uint256 tokenId) public view returns (bool) {
        return bytes(_tokenName[tokenId]).length > 0 ? true : false;
    }

    function isNameReserved(string memory nameString) public view returns (bool) {
        return _nameReserved[toLower(nameString)];
    }

    function toggleReserveName(string memory str) internal {
        _nameReserved[toLower(str)] = true;
    }

    // TODO Not locked testing
    function changeName(uint256 tokenId, string memory newName) public notLocked {
        address owner = ownerOf(tokenId);

        require(_msgSender() == owner, "ERC721: caller is not the owner");
        require(hasBeenNamed(tokenId) == false, "Token already named");
        require(validateName(newName) == true, "Not a valid new name");
        require(isNameReserved(newName) == false, "Name already reserved");

        toggleReserveName(newName);
        _tokenName[tokenId] = newName;

        emit NameChange(tokenId, newName);
    }

    function validateName(string memory str) public pure returns (bool) {
        bytes memory b = bytes(str);
        if(b.length < 1) return false;
        if(b.length > 25) return false; // Cannot be longer than 25 characters
        if(b[0] == 0x20) return false; // Leading space
        if (b[b.length - 1] == 0x20) return false; // Trailing space

        bytes1 lastChar = b[0];

        for(uint i; i<b.length; i++){
            bytes1 char = b[i];

            if (char == 0x20 && lastChar == 0x20) return false; // Cannot contain continuous spaces

            if(
                !(char >= 0x30 && char <= 0x39) && //9-0
            !(char >= 0x41 && char <= 0x5A) && //A-Z
            !(char >= 0x61 && char <= 0x7A) && //a-z
            !(char == 0x20) //space
            )
                return false;

            lastChar = char;
        }

        return true;
    }

    function toLower(string memory str) public pure returns (string memory) {
        bytes memory bStr = bytes(str);
        bytes memory bLower = new bytes(bStr.length);
        for (uint i = 0; i < bStr.length; i++) {
            // Uppercase character
            if ((uint8(bStr[i]) >= 65) && (uint8(bStr[i]) <= 90)) {
                bLower[i] = bytes1(uint8(bStr[i]) + 32);
            } else {
                bLower[i] = bStr[i];
            }
        }
        return string(bLower);
    }

   /***********************************|
   |        LIVE & DIE FUNCTIONS       |
   |***********************************/

    function isTokenDeceased(uint256 tokenId) public view returns (bool) {
        return _tokenDeceased[tokenId];
    }

    function purge(uint256 tokenId, string memory cause) external onlySigner notLocked {
        _tokenDeceased[tokenId] = true;
        emit OGPurged(tokenId, cause);
    }

    // We don't require that the owner be one who revives an OG to allow altruistic revivals
    // TODO Not locked testing
    function revive(uint256 tokenId) external payable notLocked {
        require(isTokenDeceased(tokenId) == true, "OG is not deceased");
        require(ZOO_REVIVE_PRICE <= msg.value, "INSUFFICIENT_ETH");

        _tokenDeceased[tokenId] = false;
        emit OGRevived(tokenId, msg.sender);
    }

    /***********************************|
    |         PRICE MANAGEMENT          |
    |***********************************/

    function setPrice(uint256 newPrice) external onlySigner {
        ZOO_PRICE = newPrice;
    }

    function setRevivePrice(uint256 newPrice) external onlySigner {
        ZOO_REVIVE_PRICE = newPrice;
    }

    /***********************************|
    |     OWNER MANAGEMENT FUNCTIONS    |
    |***********************************/

    function lockMetadata() external onlyOwner {
        locked = true;
    }

    function togglePresaleStatus() external onlyOwner {
        presaleLive = !presaleLive;
    }

    function toggleSaleStatus() external onlyOwner {
        saleLive = !saleLive;
    }

    function setSignerAddress(address addr) external onlyOwner {
        _signerAddress = addr;
    }

    function setProvenanceHash(string calldata hash) external onlyOwner notLocked {
        proof = hash;
    }

    function setContractURI(string calldata URI) external onlyOwner notLocked {
        _contractURI = URI;
    }

    function setBaseURI(string calldata URI) external onlyOwner notLocked {
        _tokenBaseURI = URI;
    }

    function setLoveToken(address _love) external onlyOwner notLocked {
        loveToken = LOVE(_love);
    }

    /***********************************|
    |               URI                 |
    |***********************************/

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    function tokenURI(uint256 tokenId) public view override(ERC721) returns (string memory) {
        require(_exists(tokenId), "Cannot query non-existent token");

        if(!isTokenDeceased(tokenId)) {
            return string(abi.encodePacked(_tokenBaseURI, tokenId.toString()));
        } else {
            return string(abi.encodePacked(_tokenBaseURI, tokenId.toString(), "/deceased"));
        }
    }
}