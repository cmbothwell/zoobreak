// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

/**
 * @title Recover
 * @dev Recover an
 */

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Recover {
    using ECDSA for bytes32;

    function ecr (bytes32 msgh, uint8 v, bytes32 r, bytes32 s) public pure returns (address sender) {
        return ecrecover(msgh, v, r, s);
    }

    function recoverHash(bytes32 hash, bytes memory signature) public pure returns (address sender) {
        return hash.recover(signature);
    }

    function hashTransaction(address sender, uint256 qty, string memory nonce) public pure returns(bytes32) {
        bytes32 hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n160", abi.encode(sender, qty, nonce)));

        return hash;
    }
}